var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-tsc');

function errorLog (error) {
  console.error.bind(error);
  this.emit('end');
}

//The --sourcemap option is used to generate a .js.map file. 
//It is used by debuggers to map the generated JavaScript to the source TypeScript.
gulp.task('typescript-compile', function(){
  return gulp.src(['src/ts/*.ts'])
    .pipe(typescript())
    // .pipe(sourcemaps.init())     
    // .pipe(sourcemaps.write("src/js/maps"))
    .on('error', errorLog)
    .pipe(gulp.dest('src/js/'));
});

// watch the files for changes and rebuild everything
gulp.task('watch', function () {
  gulp.watch('src/typescript/*.ts', ['typescript-compile']);
});

gulp.task('default', ['typescript-compile', 'watch']);
