module.exports = gulp
#----------------------------------------
gulp 	= require 'gulp'
coffee 	= require 'gulp-coffee'
compass	= require 'gulp-compass'
jade	= require 'gulp-jade'
plumber = require 'gulp-plumber'
srcmap 	= require 'gulp-sourcemaps'
util	= require 'gulp-util'
notify 	= require 'gulp-notify'
# run		= require 'gulp-run'

# not gulp package
bsync	= require 'browser-sync'
del 	= require 'del'

#----------------------------------------
jadeArgs =
	pretty: true

compassArgs = 
	css: 'public/css'
	sass: 'src/sass'

plumberArgs =
	errorHandler:
		notify.onError '<%= error.message %>'

#----------------------------------------
gulp.task 'jade', ->
	gulp.src 'src/*.jade'
		.pipe plumber plumberArgs
		.pipe jade jadeArgs
		.pipe gulp.dest 'public'

gulp.task 'coffee', ->
	gulp.src 'src/coffee/*.coffee'
		.pipe plumber plumberArgs
		.pipe srcmap.init()
		.pipe coffee({bare: true})
		.pipe srcmap.write()
		.pipe gulp.dest 'public/js'

gulp.task 'compass', ->
	gulp.src 'src/sass/*.sass'
		.pipe plumber plumberArgs
		.pipe compass compassArgs
		.pipe gulp.dest 'public/css'

reload = bsync.reload

gulp.task 'bsync', [], ->
	bsync
		proxy: 'gi-eye.local:8080'
		port: 8080
		notify: false

gulp.task 'copy', ->
	gulp.src 'src/package.json'
		.pipe gulp.dest 'public'
	gulp.src 'src/*.php'
		.pipe gulp.dest 'public'
	gulp.src 'src/file/*.php'
		.pipe gulp.dest 'public/file'
	gulp.src 'src/assets/**'
		.pipe gulp.dest 'public/assets'
	gulp.src 'src/js/lib/*.js'
		.pipe gulp.dest 'public/js/lib'

#----------------------------------------
gulp.task 'default', ['jade', 'coffee', 'compass', 'copy', 'bsync'], ->
	gulp.watch ['src/*.jade', 'src/shader/**'], ['jade', reload]
	gulp.watch 'src/coffee/*.coffee', ['coffee', reload]
	gulp.watch 'src/sass/*.sass', ['compass', reload]
	gulp.watch ['src/package.json', 'src/*.php', 'src/file/*.php', 'src/assets/**', 'src/js/lib/*.js'], ['copy', reload]
