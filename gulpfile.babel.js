import gulp from 'gulp';

// HTML
import nunjucksRender from 'gulp-nunjucks-render';

// HTML
// import htmlmin from 'gulp-htmlmin';

// Styling related packages
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import minifyCSS from 'gulp-csso';
import sourcemaps from 'gulp-sourcemaps';
import gutil from 'gulp-util';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import data from 'gulp-data';

// Browsersync
import bs from 'browser-sync';
const browserSync = bs.create();
gulp.task('watch-projects', function(){
  watchDir({
      output: 'group/',
      njk: 'group/parts/**/*.html',
      html: 'group/parts/*.html'});
  });
function watchDir(project) {
  gulp.watch('src/article.njk', function() {render();});
}
function render() {
  let data_input;
  fetch("https://kerckhoff.dailybruin.com/manage/packages/flatpages/travelgrant2018")
    .then(res => res.json())
    .then(res_json => {
      for(let i = 0; i < res_json.data["data.aml"].photoessay.images.length; i++) {
        if(res_json.images.s3[res_json.data["data.aml"].photoessay.images[i].Img]) {
          res_json.data["data.aml"].photoessay.images[i].Img = res_json.images.s3[res_json.data["data.aml"].photoessay.images[i].Img];
        }
        data_input = res_json;
      }
    });
  gutil.log('hello1');
  posts('src/article.njk', 'dev/', data_input['data.aml']);
}
function posts(template, output, posts) {
  Object.keys(posts).forEach(key=> {
    posts[key].forEach(article => {
      html(template, output, article, {basename: article['Name'], extname: ".html"});
    })
  })
  // for (var item in posts) {
  //   // for (var section in item) {
  //   //   gutil.log('hello');
  //   //   gutil.log(section);
  //   //   html(template, output, section, {basename: posts['Name'], extname: ".html"});
  //   // }
  // }
}
function html(template, output, thedata, name) {
  gulp.src(template)
  .pipe(data(thedata))
  .pipe(nunjucksRender({path: ['src/']}))
  .pipe(rename(name))
  .pipe(gulp.dest(output));
}

gulp.task('styles', () =>
  gulp
    .src('./src/*.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'expanded',
      }).on('error', sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dev/css'))
    .pipe(browserSync.stream())
);

function returnData() {
  let res_json = require('./data.json');
  for(let i = 0; i < res_json.data["data.aml"].photoessay.length; i++) {
    for(let j = 0; j < res_json.data["data.aml"].photoessay[i].images.length; j++) {
      if(res_json.images.s3[res_json.data["data.aml"].photoessay[i].images[j].Img]) {
        res_json.data["data.aml"].photoessay[i].images[j].Img = res_json.images.s3[res_json.data["data.aml"].photoessay[i].images[j].Img].url;
      }
    }
  }

  for(let i = 0; i < res_json.data["data.aml"].sonoma.length; i++) {
    gutil.log(res_json.images.s3[res_json.data["data.aml"].sonoma[i].Leadimg]);
    if(res_json.images.s3[res_json.data["data.aml"].sonoma[i].Leadimg]) {
      res_json.data["data.aml"].sonoma[i].Leadimg = res_json.images.s3[res_json.data["data.aml"].sonoma[i].Leadimg].url;
    }
  }
  return res_json.data["data.aml"];
}

gulp.task('html', () =>
  gulp
    .src('src/*.{njk,html}')
    .pipe(data(returnData()))
    .pipe(
      nunjucksRender({
        path: ['src/'],
      })
    )
    .pipe(gulp.dest('dev/'))
);

gulp.task('images', () => {
  gulp.src('src/images/*').pipe(gulp.dest('dev/img'));
});

gulp.task('scripts', () =>
  gulp
    .src('src/**/*.js')
    .pipe(gulp.dest('dev/js'))
);

gulp.task('development', ['html', 'styles', 'images', 'scripts', 'watch-projects'], () => {
  browserSync.init({
    server: {
      baseDir: './dev',
      serveStaticOptions: {
        extensions: ['html'],
      },
    },
  });

  gulp.watch('src/**/*.{njk,html}', ['html']).on('change', browserSync.reload);
  gulp.watch('src/**/*.scss', ['styles']);
  gulp.watch('src/**/*.js', ['scripts']);
});

gulp.task('clean', () => del(['dev/', 'prod/']));
gulp.task('default', ['development']);
gulp.task('build', ['production']);
gulp.task('test', ['watch-projects']);
