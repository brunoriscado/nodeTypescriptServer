var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-tsc');
var tsProject = ts.createProject('tsconfig.json');
var del = require('del');

function errorLog (error) {
  	console.error.bind(error);
  	this.emit('end');
}

//The --sourcemap option is used to generate a .js.map file. 
//It is used by debuggers to map the generated JavaScript to the source TypeScript.
gulp.task('typescript-compile', function() {
  	return tsProject.src(['src/ts/**/*.ts'])
		.pipe(ts(tsProject))
    	.pipe(sourcemaps.init())     
    	.pipe(sourcemaps.write("maps")) //fix the mapping folder structure
    	.on('error', errorLog)
    	.pipe(gulp.dest('src/js')); //fix the dest folder structure
});

// watch the files for changes and rebuild everything
gulp.task('watch', function () {
  	gulp.watch(['src/ts/**/*.ts'], ['typescript-compile']);
});

gulp.task('clean', function() {
    del.sync(['src/js/**/*', '!src/js']);
});

gulp.task('default', ['typescript-compile', 'watch']);
