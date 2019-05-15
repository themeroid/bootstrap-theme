const { src, dest, series, parallel, watch } = require("gulp");
const del = require("del");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const cssnano = require("gulp-cssnano");
const sass = require("gulp-sass");
const imagemin = require("gulp-imagemin");
const inlinesource = require("gulp-inline-source");
const bs = require("browser-sync").create();

const path = {
  root: "app/",
  rootfile: "app/index.html",
  dist: "dist/",
  tmp: "tmp/",
  assets: "app/assets/**/*.*",
  css: "app/assets/css/**/*.css",
  js: "app/assets/js/**/*.js",
  img: "app/assets/img/**/*.*",
  scss: "app/assets/scss/*.scss",
  vendor: "app/assets/vendor/**/*.*",
  html: "app/**/*.html"
};

// clean temp
function cleanTemp() {
  return del(path.tmp);
}

// clean dest
function cleanDest() {
  return del(path.dist);
}

// copy assets
function copy() {
  return src([path.assets, "!" + path.scss])
    .pipe(dest(path.tmp + "assets/"))
    .pipe(src(path.html))
    .pipe(dest(path.tmp));
}

function uglifyjs() {
  return src(path.js)
    .pipe(babel())
    .pipe(src(path.js))
    .pipe(uglify())
    .pipe(dest(path.dist + "assets/js/"));
}

function minifyCss() {
  return src(path.css)
    .pipe(cssnano())
    .pipe(dest(path.dist + "assets/css/"));
}

function compileCss() {
  return src(path.scss)
    .pipe(sass.sync())
    .pipe(dest(path.root + "assets/css/"));
}

function compressImg() {
  return src(path.img)
    .pipe(
      imagemin(
        [
          imagemin.gifsicle({ interlaced: true }),
          imagemin.jpegtran({ progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
          })
        ],
        {
          verbose: true
        }
      )
    )
    .pipe(dest(path.dist + "assets/img/"));
}

function favicon() {
  return src(path.root + "favicon.ico").pipe(dest(path.dist));
}

function faviconTmp() {
  return src(path.root + "favicon.ico").pipe(dest(path.tmp));
}
function htmlInlinesource() {
  return src(path.html)
    .pipe(inlinesource())
    .pipe(dest(path.dist));
}

exports.dev = series(cleanTemp, compileCss, copy, faviconTmp);
exports.run = series(cleanTemp, compileCss, copy, favicon, function() {
  // .init starts the server
  bs.init({
    server: "./tmp"
  });
  watch("app/scss/*.scss", series(copy));
  watch("app/*.html", series(copy)).on("change", bs.reload);
});
exports.prod = series(
  cleanDest,
  compileCss,
  minifyCss,
  parallel(uglifyjs, compressImg, favicon),
  htmlInlinesource
);
