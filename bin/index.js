#!/usr/bin/env node
const argv = require('yargs')
    .option('config', {
        alias: 'c',
        describe: 'Path to your echo360 grabber config file'
    })
    .option('dir', {
        alias: 'd',
        describe: 'Directory to output generated files to'
    })
    .option('verbose', {
        alias: 'v',
        describe: 'Enabled verbose logging to stdout',
        default: false
    })
    .boolean('verbose')
    .demandOption('config', 'Please specify a config file')
    .example(`${process.argv[1]} -c ./myconfig.conf -d ~/uni/lectures/`)
    .help()
    .argv

const verblog = argv.verbose ? console.log : () => {}

verblog('[LOG] invoked with args:', argv)

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const rp = require('request-promise')

const parse = require('../src/parser')
const to_aria2c = require('../src/aria2c_converter')

const echo360_base_url = 'https://echo360.org.au'
const echo360_syllabus_url = uuid => `${echo360_base_url}/section/${uuid}/syllabus`
const config_file = argv.config

async function main() {
    var config = yaml.safeLoad(fs.readFileSync(config_file, 'utf-8'))
    let { courses, filename_format: global_filename_format, PLAY_SESSION_COOKIE } = config
    var request_opts = { headers: {'Cookie': 'PLAY_SESSION='+PLAY_SESSION_COOKIE } }
    courses.forEach(async (course) => {
        console.log('[LOG] Fetching syllabus for course:', course.uuid)
        var syllabus_res = await rp(echo360_syllabus_url(course.uuid), request_opts).catch(console.log)
        var syllabus = JSON.parse(syllabus_res)
        let { filename_format, quality, times } = course
        var parser_opts = { filename_format: filename_format || global_filename_format, quality, times, verblog }
        console.log('[LOG] Parsing syllabus for course:', course.uuid)
        var parsed_data = parse(syllabus, parser_opts)
        console.log('[LOG] Finished parsing syllabus for course', course.uuid, 'Found', parsed_data.length, 'lectures')
        if(course.dump) {
            var dump_file = argv.dir ? path.join(argv.dir, course.dump) : course.dump
            console.log('[LOG] Dumping parsed JSON to', dump_file, 'for course', course.uuid)
            fs.writeFileSync(dump_file, JSON.stringify(parsed_data))
        }
        if(course.aria2c) {
            var aria2c_file = argv.dir ? path.join(argv.dir, course.aria2c) : course.aria2c
            console.log('[LOG] Writing aria2c file to', aria2c_file, 'for course', course.uuid)
            to_aria2c(parsed_data, aria2c_file)
        }
    })
}

main()
