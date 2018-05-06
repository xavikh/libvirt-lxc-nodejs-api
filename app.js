const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');

const websokify = require('./websockify');

const codes = require("./services/codes");
const index = require('./routes/index');
const web = require('./routes/public_web');
const user = require('./routes/users');
const vm = require('./routes/vm');
const vol = require('./routes/vol');
const iso = require('./routes/images');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use('/stylesheets',sassMiddleware({
    src: path.join(__dirname, 'views/sass'),
    dest: path.join(__dirname, 'public/stylesheets'),
    indentedSyntax: false, // true = .sass and false = .scss
    outputStyle: 'compressed',
    response: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', web);
app.use('/', index);
app.use('/user', user);
app.use('/vm', vm);
app.use('/vol', vol);
app.use('/iso', iso);

codes.initTelegram();
websokify.init_ws("", 3001, null, null);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    //res.locals.error = {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
