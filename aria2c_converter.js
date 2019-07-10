const fs = require('fs')

function to_aria2c(parsed_data, outfile) {
    var out = ''
    parsed_data.forEach(({ filename, download_url }) => {
        out += download_url
        out += '\n'
        out += '  out=' + filename
        out += '\n'
    })
    fs.writeFileSync(outfile, out)
}

module.exports = to_aria2c
