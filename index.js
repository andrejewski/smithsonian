
var express = require('express');
var Metalsmith = require('metalsmith');

var API = require('./api');

module.exports = Smithsonian;

function Smithsonian(dir, options) {
  if(!(this instanceof Smithsonian)) {
    return new Smithsonian(dir, options);
  }
  this.metalsmith = Metalsmith(dir);
  this.options = options || {};
  this.options.hotBuild = false;
}

Smithsonian.prototype.use = function(ware) {
  this.metalsmith.use(ware);
  return this;
}

Smithsonian.prototype.build = function(next) {
  this.metalsmith.build(next || function(error) {});
  return this;
}

Smithsonian.prototype.router = function() {
  return API(this);
}

Smithsonian.prototype.listen = function(port) {
  var _this = this;
  port = port || +process.env.port;
  this.build(function(error) {
    if(error) return _this.error(error);
    express()
      .use('/api', _this.router())
      .use(require('./standard')('/api'))
      .use(function(error, req, res, next) {
        _this.error(error);
        next(error);
      })
      .listen(port);
  });
}

Smithsonian.prototype.error = function(error) {
  // @override for error handling
}

