const yaml = require('js-yaml')
const fs = require('fs')
const rp = require('request-promise')

const parse = require('./parser')
const to_aria2c = require('./aria2c_converter')

const echo360_base_url = 'https://echo360.org.au'
const echo360_syllabus_url = uuid => `${echo360_base_url}/section/${uuid}/syllabus`
const config_file = './echo360_grabber.conf'

async function main() {
    var config = yaml.safeLoad(fs.readFileSync(config_file, 'utf-8'))
    let { courses, PLAY_SESSION_COOKIE } = config
    var request_opts = { headers: {'Cookie': 'PLAY_SESSION='+PLAY_SESSION_COOKIE } }
    courses.forEach(async (course) => {
        console.log('[LOG] Fetching syllabus for course:', course.uuid)
        var syllabus_res = await rp(echo360_syllabus_url(course.uuid), request_opts).catch(console.log)
        var syllabus = JSON.parse(syllabus_res)
        let { filename_format, quality, times } = course
        var parser_opts = { filename_format, quality, times }
        console.log('[LOG] Parsing syllabus for course:', course.uuid)
        var parsed_data = parse(syllabus, parser_opts)
        console.log('[LOG] Finished parsing syllabus for course', course.uuid, 'Found', parsed_data.length, 'lectures')
        if(course.dump) {
            console.log('[LOG] Dumping parsed JSON to', course.dump, 'for course', course.uuid)
            fs.writeFileSync(course.dump, JSON.stringify(parsed_data))
        }
        if(course.aria2c) {
            console.log('[LOG] Writing aria2c file to', course.aria2c, 'for course', course.uuid)
            to_aria2c(parsed_data, course.aria2c)
        }
    })
}

main()
