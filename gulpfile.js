/* jshint node:true */

var path = require('path'),
    gulp = require('gulp'),
    lazypipe = require('lazypipe'),
    chalk = require('chalk'),
    $ = require('gulp-load-plugins')();

var argv = require('minimist')(process.argv.slice(2));

var config = {
	srcPath: function (p) { p = p || ''; return path.join('app', p); },
	tmpPath: function (p) { p = p || ''; return path.join('tmp', p); },
	destPath: function (p) { p = p || ''; return path.join('dist', p); },
	vendorPath: 'bower_components',
	indexFile: 'index.html',
	serverPort: 9000,
	flags: {
		production: argv.production
	}
};

gulp.task('scripts', function () {
    return gulp.src(config.srcPath('scripts/**/*.js'))
        .pipe($.cached('scripts'))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('styles', function () {
    return gulp.src(config.srcPath('styles/**/*.css'))
        // .pipe($.cached('styles'))
        .pipe($.postcss([
            require('autoprefixer-core')({ browsers: [ 'last 2 version' ] })
        ]))
        .pipe(gulp.dest(config.tmpPath('styles')));
});

gulp.task('images', function () {
    return gulp.src(config.srcPath('images/**/*'))
        .pipe($.cached('images'))
        .pipe($.if(config.flags.production, $.imagemin()))
        .pipe(gulp.dest(config.destPath('images')));
});

gulp.task('useref', ['styles'], function () {

    var assets = $.useref.assets({ searchPath: [ config.tmpPath(), config.srcPath() ]});

    return gulp.src(config.srcPath(config.indexFile))
        .pipe(assets)

        // scripts
        .pipe($.if(config.flags.production && path.join('**', 'main.js'), $.stripDebug()))
        .pipe($.if(config.flags.production && '*.js', $.uglify()))

        // styles
        .pipe($.if(config.flags.production && path.join('**', 'main.css'), $.csso()))

        .pipe(assets.restore())
        .pipe($.useref())
        .pipe(gulp.dest(config.destPath()));
});

// Inject Bower dependencies to config.indexFile
gulp.task('wiredep', function () {

    var wiredep = require('wiredep').stream;

    return gulp.src(config.srcPath(config.indexFile))
        .pipe(wiredep())
        .pipe(gulp.dest(config.srcPath()));
});

gulp.task('connect', function (cb) {

    var connect = require('connect'),
        livereload = require('connect-livereload'),
        serveStatic = require('serve-static'),
        serveIndex = require('serve-index');

    var app = connect()
        .use(livereload({ port: config.livereloadPort }))
        .use(serveStatic(config.tmpPath()))
        .use(serveStatic(config.srcPath()))
        .use(path.join('/', config.vendorPath), serveStatic(config.vendorPath))
        .use(serveIndex(config.srcPath()));

    require('http').createServer(app)
        .listen(config.serverPort)
        .on('listening', function () {
            $.util.log(chalk.cyan('Started connect web server on http://localhost:' + config.serverPort));
        });

    cb();
});

gulp.task('audio', function () {
	return gulp.src(config.srcPath('audio/*.*'))
		.pipe(gulp.dest(config.destPath('audio')));
});

gulp.task('serve', ['connect', 'watch'], function () {
    require('opn')('http://localhost:' + config.serverPort + '/');
});

gulp.task('clean', require('del').bind(null, [ config.destPath(), config.tmpPath() ]));

gulp.task('watch', ['connect'], function () {

    $.livereload.listen();

    gulp.watch([
        config.srcPath('styles/**/*.scss'),
        config.srcPath('scripts/**/*.js'),
        config.srcPath('images/**/*'),
    ]).on('change', function (file) {

        var directory = path.relative(config.srcPath(), file.path), // e.g. styles/x/y/z.scss
            type = directory.split(path.sep)[0]; // styles, scripts, images

        // If a file was deleted, delete it from the gulp-cached cache as well
        if (file.type === 'deleted' && $.cached.caches.hasOwnProperty(type)) {
            delete $.cached.caches[type][file.path];
        }

        gulp.start(type);
    });

    gulp.watch([
        config.srcPath('scripts/**/*.js'),
        config.tmpPath('styles/**/*.css'),
        config.srcPath('images/**/*'),
        config.srcPath(config.indexFile)
    ]).on('change', $.livereload.changed);

    gulp.watch('bower.json', ['wiredep']);
});

gulp.task('build', ['useref', 'images', 'scripts', 'audio'], function () {
    return gulp.src(config.destPath('**/*'))
        .pipe($.size({ showFiles: true, gzip: true }));
});

gulp.task('default', ['clean'], function () {
    return gulp.start('build');
});
