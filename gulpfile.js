// Define gulp before we start
var gulp = require('gulp');

// Define Sass , autoprefixer, etc...
var sass = require('gulp-ruby-sass'),
    minifycss = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint'),
    watch = require('gulp-watch');

// This is an object which defines paths for the styles.
// Can add paths for javascript or images for example
// The folder, files to look for and destination are all required for sass
var paths = {
    logs: __dirname + '/logs',
    js: {
        files: './js/**/*.js'
    }
};

var config = {
    jshint: {
        "curly":true,
        "devel":true,
        "eqeqeq": true,
        "globals":{
            "angular": true
        },
        "quotmark": "single",
        "strict": true,
        "trailing": true,
        "undef":true,
        "unused":true,
        /*"reporter": require('jshint-html-reporter'),
        "reporterOutput": 'jshint-report.html'*/
    }
};

gulp.task('lint', function(){
  return gulp.src([paths.js.files])
    .pipe(jshint(config.jshint))
    .pipe(jshint.reporter('gulp-jshint-html-reporter', {
      filename: paths.logs + '/jshint-output.html'
    }));
});

gulp.task('watch', function() {

    gulp.watch(paths.styles.files, ['styles']).on('change', function(evt) {
        console.log(
            '[watcher] File ' + evt.path.replace(/.*(?=sass)/,'') + ' was ' + evt.type + ', compiling...'
        );
    });

    /*gulp.watch(paths.js.files, ['lint']);*/
}); 

gulp.task('demon', function () {
    nodemon({
        script: 'app.js',
        ext: 'js',
        ignore: ['client/'],
        env: {
          'NODE_ENV': 'development'
        }
    })
    .on('start', ['styles', 'lint', 'watch'])
    /*.on('change', ['watch'])*/
    .on('restart', ['watch']);
});

gulp.task('default', ['demon'], function() {
    // Todo: Need discuss with @Ilya
    // Merge app.js into gulpfile.js
});