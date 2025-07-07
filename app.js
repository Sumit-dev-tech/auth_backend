// var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.status(200).json({ message: '🚀 Auth Backend Connected Successfully!' });
});

// catch 404 and forward to error handler   
app.use(function(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      // Show stack trace only in development
      stack: req.app.get('env') === 'development' ? err.stack : {}
    }
  });
});

module.exports = app;
