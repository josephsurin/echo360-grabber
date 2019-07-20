# echo360-grabber

echo360-grabber is a very simple command line tool written in Node.js that grabs download links for lectures and outputs them in a format to be easily batch downloaded (currently only [aria2c](https://aria2.github.io/) output is supported, however it is very extensible (PRs welcome!))

##### Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [FAQ](#faq)


## Features <a name="features"></a>

- Specify multiple courses to grab links for
- Dump links and filenames as json, or save to an output file for aria2c
- Specify SD or HD video quality
- Specify before or after dates to filter for
- Specify what times of week to grab lectures for (useful for courses with multiple streams)
- Specify filename format, with basic templating (including lecture number and date)

## Installation <a name="installation"></a>

You can install the package from the npm registry if you'd like.

```bash
npm install -g echo360-grabber
```

or

```bash
yarn global add echo360-grabber
```

You should then be able to type `echo360-grabber --help` and see appropriate output.

Alternatively, you can clone this repository, `npm install` or `yarn install` the dependencies and run `node bin/index --help`

## Usage <a name="usage"></a>

This tool currently does not have a very feature-rich command line interface. Most of the configuration is done through a file which you can specify using the `-c` option.

```
Options:
  --version      Show version number                                   [boolean]
  --config, -c   Path to your echo360 grabber config file                [required]
  --dir, -d      Directory to output generated files to
  --before, -B   Only grab links for videos released before this date
  --after, -A    Only grab links for videos released after this date
  --verbose, -v  Enabled verbose logging to stdout    [boolean] [default: false]
  --help         Show help                                             [boolean]

Examples:
  echo360-grabber -c ./myconfig.conf -d ~/uni/lectures/ -A 2019-04-18
```

The `before` and `after` options should be in the form `yyyy-mm-dd` (e.g. `--after 2019-04-18` to filter for lectures strictly after the 18th of April 2019).

If typing a few commands is still too much, you might like to use a bash script to automate almost everything. For example:

```bash
#!/usr/bin/sh

conf="./echo360_grabber.conf"
cookies="./my_secret_cookies.txt"

# generate the .aria2c files
echo360-grabber -c "$conf" -d ./

aria2c --load-cookies "$cookies" -i linalg.aria2c -d "./Linear Algebra" -c
aria2c --load-cookies "$cookies" -i calc2.aria2c -d "./Calculus 2" -c
```

## Configuration <a name="configuration"></a>

The configuration file is a [yaml](https://yaml.org/) file and is how you specify your 'credentials' and other options. An example configuration file might look like this:

```yaml
PLAY_SESSION_COOKIE: <put your session cookie here>

# default filename format if not specified for a course
filename_format: <course_name> %dd-%mm-%yy %HH:%MM.mp4

# default before filter date if not specified for a course
before: '2019-05-17'

# default after filter date if not specified for a course
after: '2019-03-07'

courses:

    # Linear Algebra MAST10007
    - uuid:                 b8eabf0a-8795-4457-94ac-c1dd10561f30
      quality:              SD
      dump:                 linalg.json
      aria2c:               linalg.aria2c
      before:               '2019-04-07'
      times:
        - day:  mon
          time: '15:15'

        - day:  wed
          time: '12:00'

        - day:  thu
          time: '16:15'

    # Calculus 2 MAST10006
    - uuid:                 7b3a4620-6a0b-472c-a556-a146a790c872
      filename_format:       Calculus 2 %dd-%mm-%yy %HH:%MM.mp4
      quality:              SD
      aria2c:               calc2.aria2c
      times:
        - day:  mon
          time: '16:15'

        - day:  wed
          time: '16:15'

        - day:  fri
          time: '16:15'
```

Since json is valid yaml, you could specify your config file using json if you prefer that.

Some things to note about the config file:

| key | description |
| --- | --- |
| *PLAY_SESSION_COOKIE | This is a session cookie given to you by the echo360 server when you log in to https://echo360.org.au on your browser. You will need to log in and retrieve this cookie and paste it in the config file. Try to keep this safe; if someone gets access to this string of characters, they can use it to access your echo360 account. |
| filename_format | This specifies the filename format to be used for all videos where the filename format is not specified for that course |
| before | This specifies a date in the form `yyyy-mm-dd` indicating that only lectures before this date should be grabbed.
| after | This specifies a date in the form `yyyy-mm-dd` indicating that only lectures after this date should be grabbed.
| *courses[].uuid | This is a [uuid](https://en.wikipedia.org/wiki/Universally_unique_identifier) that identifies the course. You should be able to find this by going on the lectures' home page and looking at the URL bar. It is a string of characters and hyphens and should be quite obvious. |
| courses[].filename_format | This specifies the filename format to be used for videos in this course |
| courses[].quality | Either `SD` or `HD` |
| courses[].dump | A string specifying a filename to which json data containing the video links and filenames will be written to. If you don't want this to happen, do not specify this value |
| courses[].aria2c | Same as with `courses[].dump` except for a file compatible with aria2c |
| courses[].before | Same as the global `before` key, except only applies for a particular course. |
| courses[].after | Same as the global `after` key, except only applies for a particular course. |
| courses[].times | An array specifying the days and times of the week to filter for lectures. This will grab videos with a tolerance of +-30 mins, so you don't need to get it right exactly. The `day` key should be one of `mon` `tue` `wed` `thu` `fri` `sat` or `sun`. It is also essential that the `time` key is in 24 hour format and surrounded by `'`quotes`'`. If you would like to grab every video link regardless of time, simply omit this key. |

Keys prefixed with `*` are required. 

At least one of `filename_format` or `courses[].filename_format` is required.

The command line options for `before` and `after` take precedence over the config options. For example, if you had `before: 2019-05-13` in your config file, but specified `-B 2019-04-16` as a command line argument, only lectures that were released before `2019-04-16` will be grabbed.

#### Filename Format

The filename key in the configuration file can be templated using the following sequences:

`<course_name>`, `<quality>`, `%yy`, `%dd`, `%D`, `%mm`, `%HH`, `%MM`, `%N`

For example, a filename_format of `<course_name> %dd-%mm-%yy %D %HH:%MM (<quality>).mp4` might produce `Linear Algebra 04-03-2019 mon 15:20 (HD).mp4`

The `%N` sequence attempts to index the lecture, starting from 01. For example, a filename_format of `<course_name> - %N.mp4` might produce `Linear Algebra - 01.mp4`. Even if you use the `before` or `after` options, the `%N` sequence will try to calculate which lecture it is. For example, if you specify `after: 2019-04-03`, the first lecture grabbed might be the second lecture of the course, so the `%N` sequence will be replaced by `02`, not `01`. This should work, but might be buggy. 

One more thing to note with the filename format key is that it is used directly by aria2c. Because of this, you can specify directories and when the file is generated and fed into aria2c, it will automatically create the directory for you. For example, you might want to put `<course_name>/<course_name> - %N.mp4` as the filename format, which might produce `Linear Algebra/Linear Algebra - 01.mp4` and when read by aria2c, will create a directory named `Linear Algebra` and download the file into it as `Linear Algebra - 01.mp4`

## FAQ <a name="faq"></a>

#### It doesn't work!

Not really a question, but if you can't get it to work and you're getting some sort of error, open an issue and I'll try my best to help!

#### What's wrong with [other](https://github.com/soraxas/echo360) [echo360](https://github.com/lyneca/echo360) [tools](https://github.com/GeckoDM/GeckoDownloadManager)?

Nothing is wrong with these tools. I decided to create my own because:

- I didn't like the idea of using a headless browser for something that should seem achievable with just HTTP requests.
- I don't want to use an extension as to me, it kind of defeats the purpose of automating the process.
- Some of these tools facilitate downloading the videos in an attempt to make it as easy and user friendly as possible. I feel as though it is better to prioritise simplicity and customisability and therefore I decided it would be better to delegate the downloading task to program(s) dedicated to downloading files (such as aria2c).
- I wanted to be able to _easily_ specify which lectures to download based on day and time of week.

#### aria2c is throwing an error when I try to feed it the file :(

You'll need to give aria2c your cookies or else the echo360 server will deny it access. aria2c can load cookies from a file via the `--load-cookies` option. You can use [this extension](https://github.com/rotemdan/ExportCookies) to export cookies to a .txt file that aria2c can read.

#### How can I instruct aria2c to only download lectures that I don't already have downloaded?

Easy, just use the `-c` flag and it won't try to redownload lectures already at the filename specified.

#### I want to use my own download manager!

In the config, you can specify a `dump` option which will write intermediate json data to a file. You can use this however you want to format the links and filenames for your own download manager.
