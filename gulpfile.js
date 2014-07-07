var gulp    = require('gulp'),
        sass = require('gulp-sass'),
        connect= require('gulp-connect'),
        clean = require('gulp-clean');;

var paths = {
    bowerComponents:['app/bower_components/*/dist/**/*','app/bower_components/*fontawesome/**/*'],
    scripts:['app/**/*.js', '!app/bower_components/**/*.js'],
    css:['app/css/**/*.css'],
    images:['app/images/**/*.jpg', 'app/images/**/*.jpg'],
    html:['app/**/*.html'],
};

gulp.task('connect', function(){
    connect.server({
        port: 4000
    });
});

gulp.task('sass', function(){
    console.log("sass called")
    gulp.src('app/sass/**/*.scss')
            .pipe(sass())
            .pipe(gulp.dest('app/css/'));
});

gulp.task('watch', function(){


    gulp.watch('app/sass/**/*.scss',['sass']);

})




gulp.task('bowerComponents', function(){
    gulp.src(paths.bowerComponents)
            .pipe(gulp.dest('build/bower_components'));
})

gulp.task('scripts', function(){
    gulp.src(paths.scripts)
            .pipe(gulp.dest('build/'));
})

gulp.task('html', function(){
    gulp.src(paths.html)
            .pipe(gulp.dest('build/'));
})

gulp.task('css', function(){
    gulp.src(paths.css)
            .pipe(gulp.dest('build/css'));
})

gulp.task('images', function(){
    gulp.src(paths.images)
            .pipe(gulp.dest('build/images'));
})

gulp.task('clean', function(){

    gulp.src('build/', {read: false})
            .pipe(clean());

})

gulp.task('pushToGitubIO', function () {
    return gulp.src("build/**/*")
            .pipe(gulp.dest('../reboyd.github.io/'));
});

gulp.task('default', ['connect', 'watch']);

gulp.task('build', ['scripts', 'css', 'html', 'bowerComponents', 'images']);



