
var fs = require('fs');
var path = require('path');
var jade = require('jade');
var express = require('express');
var serveStatic = require('serve-static');

module.exports = function standard(apiPath) {
  var router = express.Router();
  var assets = '/assets';

  function render(res, template, locals, next) {
    var file = path.join(__dirname, 'views', template+'.jade');
    locals.baseUrl = res.req.baseUrl;
    locals.apiUrl = apiPath;
    locals.link = function(href) {
      if(href.charAt(0) == '/') {
        return href;
      } else {
        href = '/' + href;
      }
      return res.req.baseUrl + assets + href;
    }
    res.write(jade.renderFile(file, locals));
    res.end();
  }

  var publicDir = path.join(__dirname, 'public');

  router.use(assets, serveStatic(publicDir));

  router.get('*', function(req, res, next) {
    render(res, 'app', {path: path}, next);
  });

  return router;
}

