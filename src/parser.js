function parse(syllabus, options) {
    let { data } = syllabus
    parsed_data = []
    var N = 1
    data.forEach(({ lesson }) => {
        if(!lesson.hasAvailableVideo || (options.times && !within_times(lesson, options.times))) return
        let { video: { media: { media: { current: { primaryFiles } } } } } = lesson
        primaryFiles.sort(({ size: a }, { size: b }) => options.quality == 'SD' ? a - b : b - a)
        let { s3Url } = primaryFiles[0]
        var filename = build_filename(lesson, N++, options.quality, options.filename_format)
        var parsed_lesson = { filename, quality: options.quality, download_url: s3Url }
        parsed_data.push(parsed_lesson)
    })
    return parsed_data
}

const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function within_times(lesson, times) {
    /* returns true if the lesson is within_time for at least one time in times, false otherwise */
    let { lesson: { timing: { start } } } = lesson
    return times.some(time => within_time(start, time))
}

function within_time(target, time) {
    /* returns true if the time indicated by target is within 30 minutes of time, false otherwise */
    var target_date = new Date(target)
    if(days[target_date.getDay()] != time.day.toLowerCase()) return false
    var spec_date = new Date(target.split('T')[0]+'T'+time.time)
    return Math.abs(spec_date - target_date) < 1000*60*30
}

function build_filename(lesson, N, quality, filename_format) {
    let { lesson: { timing: { start } }, video: { published: { courseName } } } = lesson
    var lesson_date = new Date(start)
    return filename_format
        .replace(/<course_name>/g, courseName)
        .replace(/<quality>/g, quality)
        .replace(/%yy/g, lesson_date.getFullYear())
        .replace(/%dd/g, lesson_date.getDate().toString().padStart(2, '0'))
        .replace(/%D/g, days[lesson_date.getDay()])
        .replace(/%mm/g, (lesson_date.getMonth()+1).toString().padStart(2, '0'))
        .replace(/%HH/g, lesson_date.getHours().toString().padStart(2, '0'))
        .replace(/%MM/g, lesson_date.getMinutes().toString().padStart(2, '0'))
        .replace(/%N/g, N.toString().padStart(2, '0'))
}

module.exports = parse
