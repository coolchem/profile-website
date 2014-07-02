var gulp    = require('gulp'),
        sass = require('gulp-sass'),
        express = require('express'),
        refresh = require('gulp-livereload'),
        server  = require('tiny-lr')();

var paths = {
    scripts:['app/**/*.js'],
    css:['app/**/*.css'],
    json:['app/**/*.json'],
    html:['app/**/*.html'],
};

gulp.task('expressServer', function(){
    app = express();
    app.use(require('connect-livereload')());
    app.use(express.static(__dirname));
    app.listen(4000);
});

gulp.task('html', function(){
    gulp.src(paths.html)
            .pipe(gulp.dest('build/'))
            .pipe(refresh(server));
})

gulp.task('scripts', function(){
    gulp.src(paths.scripts)
            .pipe(gulp.dest('build/'))
            .pipe(refresh(server));
})

gulp.task('sass', function(){
    console.log("sass called")
    gulp.src('app/sass/**/*.scss')
            .pipe(sass())
            .pipe(gulp.dest('app/css/'))
            .pipe(refresh(server));
});

gulp.task('watch', function(){


    gulp.watch('app/sass/**/*.scss',['sass']);

    gulp.watch(paths.html, ['html']);

    gulp.watch(paths.scripts, ['scripts']);

})

gulp.task('default', ['expressServer', 'html', 'sass', 'scripts', 'watch']);



