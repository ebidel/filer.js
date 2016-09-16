const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const closure = require('google-closure-compiler-js').gulp();
const injectVersion = require('gulp-inject-version');

const $ = gulpLoadPlugins();

function license() {
  return $.license('Apache', {
    organization: 'Copyright (c) 2016 Eric Bidelman. All rights reserved.\n\n * @version %%GULP_INJECT_VERSION%%',
    tiny: true
  });
}

gulp.task('script', function() {
  return gulp.src('./src/filer.js', {base: './'})
      .pipe(closure({
          compilationLevel: 'SIMPLE',
          warningLevel: 'DEFAULT',
          languageIn: 'ECMASCRIPT6_STRICT',
          languageOut: 'ECMASCRIPT5',
          jsOutputFile: 'filer.min.js',
          createSourceMap: true,
        }))
      .pipe(license()) // Add license to top.
      .pipe(injectVersion())
      .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['script'], function() {

});
