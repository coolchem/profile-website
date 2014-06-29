var gulp    = require('gulp'),
        sass = require('gulp-sass'),
        express = require('express'),
        refresh = require('gulp-livereload'),
        server  = require('tiny-lr')();

gulp.task('expressServer', function(){
    app = express();
    app.use(require('connect-livereload')());
    app.use(express.static('src/'));
    app.listen(4000);
});

gulp.task('html', function(){
    gulp.src('src/**/*.html')
            .pipe(gulp.dest('build/'))
            .pipe(refresh(server));
})

gulp.task('sass', function(){
    gulp.src('src/sass/**/*.sass')
            .pipe(sass())
            .pipe(gulp.dest('src/css/'))
            .pipe(refresh(server));
});

gulp.task('default', ['expressServer', 'html', 'sass'], function() {
    server.listen(35728, function (error) {
        if (error) return console.log(error);

        gulp.watch('src/sass/**/*.sass',['sass']);

        gulp.watch('src/**/*.html', ['html']);
    });
});



