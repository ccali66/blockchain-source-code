var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var testRouter = require('./routes/testdb');
var usersRouter = require('./routes/users');
var testinRouter = require('./routes/testin');
var LoginRouter = require('./routes/login');
var hospitalRouter = require('./routes/hospital');
var careRouter = require('./routes/care');

var mysql = require("mysql");
var con = mysql.createConnection({
    host: "140.118.9.225",
    user: "demo1",
    password: "P@ssw0rd",
    database: "authentication",
    port: 3306
});

con.connect(function(err) {
    if (err) {
      console.log(err);
      console.log('connecting error');
      return;
    }
    console.log('connecting success');
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade', 'ejs');
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/hospital',express.static(path.join(__dirname, 'public')));
app.use('/care',express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next){
    req.con = con;
    next();
});

app.use('/', indexRouter);
app.use('/testdb', testRouter);
app.use('/users', usersRouter);
app.use('/testin', testinRouter);
app.use('/login', LoginRouter);
app.use('/hospital', hospitalRouter);
app.use('/care', careRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
