function parse(syllabus, options) {
    let { data } = syllabus
    parsed_data = []
    /* sort the data by time so we get correct indexing */
    data.sort((a, b) => {
        let { lesson: { lesson: { timing: { start: start_a } } } } = a
        let { lesson: { lesson: { timing: { start: start_b } } } } = b
        return new Date(start_a) - new Date(start_b)
    })
    var N = 1
    data.forEach(({ lesson }) => {
        if(is_invalid_lesson(lesson, options)) return
        let { video: { media: { media: { current: { primaryFiles } } } } } = lesson
        primaryFiles.sort(({ size: a }, { size: b }) => options.quality == 'SD' ? a - b : b - a)
        let { s3Url } = primaryFiles[0]
        var filename = build_filename(lesson, N++, options.quality, options.filename_format)
        var parsed_lesson = { filename, quality: options.quality, download_url: s3Url }
        parsed_data.push(parsed_lesson)
    })
    return parsed_data
}

function get_lesson_start(lesson) {
    return lesson.lesson.timing.start
}

function get_lesson_course_name(lesson) {
    return lesson.video.published.courseName
}

function is_invalid_lesson(lesson, options) {
    var is_invalid = !lesson.hasAvailableVideo ||
        (options.times && !within_times(lesson, options.times)) ||
        (options.before && !before_date(lesson, options.before)) ||
        (options.after && !after_date(lesson, options.after))
    if(lesson.hasAvailableVideo) {
        verblog('[LOG]', is_invalid ? 'Skipping' : 'Adding', get_lesson_course_name(lesson), get_lesson_start(lesson))
    }
    return is_invalid
}

const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function within_times(lesson, times) {
    /* returns true if the lesson is within_time for at least one time in times, false otherwise */
    var start = get_lesson_start(lesson)
    return times.some(time => within_time(start, time))
}

function within_time(target, time) {
    /* returns true if the time indicated by target is within 30 minutes of time, false otherwise */
    var target_date = new Date(target)
    if(days[target_date.getDay()] != time.day.toLowerCase()) return false
    var spec_date = new Date(target.split('T')[0]+'T'+time.time)
    return Math.abs(spec_date - target_date) < 1000*60*30
}

function before_date(lesson, date) {
    /* returns true if the lesson start time occurred (strictly) before `date` */
    var start = get_lesson_start(lesson)
    return new Date(date) > new Date(start)
}

function after_date(lesson, date) {
    /* returns true if the lesson start time occurred (strictly) after `date` */
    var start = get_lesson_start(lesson)
    return new Date(date) < new Date(start)
}

function build_filename(lesson, N, quality, filename_format) {
    var start = get_lesson_start(lesson)
    var course_name = get_lesson_course_name(lesson)
    var lesson_date = new Date(start)
    return filename_format
        .replace(/<course_name>/g, course_name)
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
