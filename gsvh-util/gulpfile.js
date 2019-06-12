const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const del = require('del');
const bsync = require('browser-sync').create();
const notifier = require('node-notifier');
const NwBuilder = require('nw-builder');

//----------------------------------------
// compile

const pugArgs = { pretty: true };

const sassArgs = {
	css: 'public/css',
	sass: 'src/sass'
};

gulp.task('pug', () =>
	gulp
		.src('src/*.pug')
		.pipe($.plumber())
		.pipe(
			$.pug(pugArgs).on('error', function(err) {
				console.log(err.message);
				return notifier.notify({
					title: '[pug] Syntax Error',
					message: `${err.filename}:${err.line}`,
					sound: true
				});
			})
		)
		.pipe(gulp.dest('public'))
);

gulp.task(
	'coffee',
	() => gulp.src('src/coffee/*.js').pipe(gulp.dest('public/js'))
	// gulp
	// 	.src('src/coffee/*.coffee')
	// 	.pipe($.plumber())
	// 	.pipe($.sourcemaps.init())
	// 	.pipe(
	// 		$.coffee({ bare: true }).on('error', function(err) {
	// 			console.log(err.message);
	// 			return notifier.notify({
	// 				title: err.message,
	// 				message: `${err.filename}:${err.location.first_line}`,
	// 				sound: true
	// 			});
	// 		})
	// 	)
	// 	.pipe($.sourcemaps.write())
	// 	.pipe(gulp.dest('public/js'))
);

gulp.task('sass', () =>
	gulp
		.src(['src/sass/main.sass', 'src/sass/simple-gui.sass'])
		.pipe($.plumber())
		.pipe(
			$.sass(sassArgs).on('error', function(err) {
				console.log(err.message);
				return notifier.notify({
					title: '[sass] compile error',
					message: `${err.fileName}`,
					sound: true
				});
			})
		)
		.pipe(gulp.dest('public/css'))
);

//----------------------------------------
// util

gulp.task('bsync', () =>
	bsync.init({
		server: {
			baseDir: './public'
		},
		open: false,
		notify: false
	})
);

gulp.task('reload', () => {
	bsync.reload();
});

gulp.task('clean', () => del('./public/**/*'));

gulp.task('copy', function() {
	gulp.src('src/package.json').pipe(gulp.dest('public'));
	gulp.src('src/assets/**').pipe(gulp.dest('public/assets'));
	return gulp.src('src/js/lib/*.js').pipe(gulp.dest('public/js/lib'));
});

gulp.task('watch', () => {
	gulp.watch(['src/*.pug', 'src/shader/**'], gulp.series('pug', 'reload'));
	gulp.watch('src/coffee/*.js', gulp.series('coffee', 'reload'));
	gulp.watch('src/sass/*.sass', gulp.series('sass', 'reload'));
	gulp.watch(
		['src/package.json', 'src/assets/**', 'src/js/lib/*.js'],
		gulp.series('copy', 'reload')
	);
});

//----------------------------------------
// default & build

gulp.task(
	'default',
	gulp.series(
		gulp.parallel('pug', 'coffee', 'sass', 'copy'),
		gulp.parallel('bsync', 'watch')
	)
);

gulp.task('build', gulp.parallel('pug', 'coffee', 'sass', 'copy'), () => {
	gulp
		.src('src/package-build.json')
		.pipe(rename('package.json'))
		.pipe(gulp.dest('public'));

	const nw = new NwBuilder({
		files: ['./public/**/*', './node_modules/**/*'],
		platforms: ['osx64']
	});

	nw.on('log', console.log);

	const nwArgs = { buildType: 'versioned' };

	nw.build(nwArgs)
		.then(() => console.log('NwBuilder: all done!'))
		.catch(err => console.error(err));
});
