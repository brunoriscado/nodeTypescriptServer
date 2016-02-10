var gulp = require("gulp");
var ts = require("gulp-typescript");
var exec = require('child_process').exec;
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-tsc');
var tsProject = ts.createProject('tsconfig.json');
var del = require('del');
// var jasmine = require('gulp-jasmine');
var forever = require('forever-monitor');
var path = require('path');

function errorLog (error) {
  	console.error.bind(error);
  	this.emit('end');
}

//The --sourcemap option is used to generate a .js.map file.
//It is used by debuggers to map the generated JavaScript to the source TypeScript.
gulp.task('typescript-compile', function() {
  	return tsProject.src([path.join('.', 'src', 'ts', '**', '*.ts')])
		.pipe(ts(tsProject))
    	// .pipe(sourcemaps.init())
    	// .pipe(sourcemaps.write("maps")) //fix the mapping folder structure
    	.on('error', errorLog)
    	.pipe(gulp.dest('lib')); //fix the dest folder structure
});


// gulp.task('typescript-compile',  function (cb) {
//   exec('tsc', function (err, stdout, stderr) {
//     console.log(stdout);
//     console.log(stderr);
//     cb(err);
//   });
// });

// watch the files for changes and rebuild everything
gulp.task('watch', function () {
  	gulp.watch(['src/ts/**/*.ts'], ['typescript-compile']);
});

gulp.task('clean', function() {
    del.sync(['lib/**/*.js', 'lib/**/*.ts', 'lib/**/*.map', 'lib/**', '!lib']);
});

gulp.task('run', function () {
    new forever.Monitor('lib/server-test.js').start();
});

gulp.task('default', ['clean', 'typescript-compile', 'watch']);

// gulp.task('test', 'Runs the Jasmine test specs', ['typescript-compile'], function () {
//   return gulp.src('test/*.js')
//     .pipe(jasmine());
// });