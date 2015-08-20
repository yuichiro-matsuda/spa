// package import
var gulp = require('gulp');

//compass settings
var compass = require('gulp-compass');

gulp.task('compass', function () {
  return gulp.src('./sass_style/sass/*.scss')
             .pipe(compass({
               config_file : './sass_style/config.rb',
               css : './sass_style/stylesheets/',
               sass: './sass_style/sass/'
             }));
});

// watch file update
gulp.task('watch', function() {
    // watch scss
    gulp.watch([
        './sass_style/sass/*.scss' // when modified *.scss,
    ],['compass']); // task compass will run
});

// register task
// default ( watch scss & build )
gulp.task('default', [
    'watch'
]);
