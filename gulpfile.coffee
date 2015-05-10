module.exports = gulp

#----------------------------------------

gulp 	= require 'gulp'
coffee 	= require 'gulp-coffee'
compass	= require 'gulp-compass'
jade	= require 'gulp-jade'
plumber = require 'gulp-plumber'
srcmap 	= require 'gulp-sourcemaps'
util	= require 'gulp-util'
rename 	= require 'gulp-rename'

runseq 	= require 'run-sequence'
del 	= require 'del'
bsync	= require('browser-sync').create()
notifier= require 'node-notifier'
NwBuilder=require 'node-webkit-builder'

#----------------------------------------
# compile

jadeArgs =
	pretty: true

compassArgs = 
	css: 'public/css'
	sass: 'src/sass'

gulp.task 'jade', ->
	gulp.src 'src/*.jade'
		.pipe plumber()
		.pipe jade(jadeArgs).on 'error', (err)->
			console.log err.message
			notifier.notify
				title: "[jade] Syntax Error"
				message: "#{err.filename}:#{err.line}"
				sound: true
		.pipe gulp.dest 'public'

gulp.task 'coffee', ->
	gulp.src 'src/coffee/*.coffee'
		.pipe plumber()
		.pipe srcmap.init()
		.pipe coffee({bare: true}).on 'error', (err) ->
			notifier.notify
				title: err.message
				message: "#{err.filename}:#{err.location.first_line}"
				sound: true
		.pipe srcmap.write()
		.pipe gulp.dest 'public/js'

gulp.task 'compass', ->
	gulp.src 'src/sass/*.sass'
		.pipe plumber()
		.pipe compass(compassArgs).on 'error', (err) ->
			notifier.notify
				title: "[sass] compile error"
				message:"#{err.fileName}"
				sound: true
		.pipe gulp.dest 'public/css'

reload = bsync.reload

#----------------------------------------
# util

gulp.task 'bsync', [], ->
	bsync.init
		server:
			baseDir: './public'
		open: false
		notify: false

gulp.task 'clean', ->
	del "./public/**/*"


gulp.task 'copy', ->
	gulp.src 'src/package.json'
		.pipe gulp.dest 'public'
	gulp.src 'src/assets/**'
		.pipe gulp.dest 'public/assets'
	gulp.src 'src/js/lib/*.js'
		.pipe gulp.dest 'public/js/lib'


#----------------------------------------
# default & build

gulp.task 'default', ->
	runseq ['jade', 'coffee', 'compass', 'copy'], 'bsync', ->
		gulp.watch ['src/*.jade', 'src/shader/**'], ['jade', reload]
		gulp.watch 'src/coffee/*.coffee', ['coffee', reload]
		gulp.watch 'src/sass/*.sass', ['compass', reload]
		gulp.watch ['src/package.json', 'src/assets/**', 'src/js/lib/*.js'], ['copy', reload]

gulp.task 'build', ->
	runseq ['jade', 'coffee', 'compass', 'copy'], ->
		gulp.src 'src/package-build.json'
			.pipe rename 'package.json'
			.pipe gulp.dest 'public'
		

		nw = new NwBuilder
			files: './public/**/*'
			platforms: ['osx64']

		nw.on 'log', console.log 

		nwArgs =
			buildType: 'versioned'
			

		nw.build(nwArgs).then(->
			console.log "NwBuilder: all done!"
		).catch( (err) ->
			console.error err
		)

