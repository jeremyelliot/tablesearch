/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var gulp = require('gulp'),
        uglify = require('gulp-uglify');

gulp.task('minify', function () {

  gulp.src('src/*.js')
          .pipe(uglify())
          .pipe(gulp.dest('dist'));

});

gulp.task('build', ['minify']);
