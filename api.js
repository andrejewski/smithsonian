
var fs = require('fs');
var path = require('path');
var async = require('async');
var mkdirp = require('mkdirp');
var express = require('express');
var bodyParser = require('body-parser');

function api(smithsonian) {
  var router = express.Router();
  router.use(bodyParser.json());

  function filepath(str) {
    var dir = smithsonian.metalsmith.source();
    return path.join(dir, str.replace(/\//g, path.sep));
  }

  function hotReload(req, res, next) {
    if(smithsonian.options.hotBuild) {
      smithsonian.build(function(error) {
        if(error) return next(error);
        res.json({ok: true});
      });
    } else {
      res.json({ok: true});
    }
  }

  function splatFilepath(req, res, next) {
    req.filepath = filepath(req.params[0] || '');
    next();
  }

  function fileTree(root, filepath, next) {
    var name = path.basename(filepath);
    var href = path.relative(root, filepath);
    fs.stat(filepath, function(error, stats) {
      if(error) return next(error);
      if(stats.isDirectory()) {
        fs.readdir(filepath, function(error, filenames) {
          if(error) return next(error);
          var filepaths = filenames.map(function(file) {
            return path.join(filepath, file);
          });
          async.map(filepaths, fileTree.bind(null, root), function(error, trees) {
            if(error) return next(error);
            next(null, {path: href, name: name, kind: 'folder', children: trees});
          })
        });
      } else {
        next(null, {path: href, name: name, kind: 'file'});
      }
    });
  }

  router.route('/tree/*?')
    .all(splatFilepath)
    .get(function(req, res, next) {
      var root = smithsonian.metalsmith.source();
      fileTree(root, req.filepath, function(error, tree) {
        if(error) return next(error);
        res.json({tree: tree});
      });
    });

  router.route('/folder/*?')
    .all(splatFilepath)
    .get(function(req, res, next) {
      fs.readdir(req.filepath, function(error, filenames) {
        if(error) return next(error);
        res.json({filenames: filenames});
      });
    })
    .post(function(req, res, next) {
      mkdirp(req.filepath, function(error) {
        if(error) return next(error);
        next();
      });
    })
    .put(function(req, res, next) {
      if(req.body.rename && req.body.filepath) {
        var destpath = filepath(req.body.filepath);
        mkdirp(path.dirname(destpath), function(error) {
          if(error) return next(error);
          fs.rename(req.filepath, destpath, function(error) {
            if(error) return next(error);
            next()
          });
        });
      } else {
        var error = new Error("You can only rename directories.");
        next(error); 
      }
    })
    .delete(function(req, res, next) {
      fs.rmdir(req.filepath, function(error) {
        if(error) return next(error);
        next()
      });
    })
    .all(hotReload);

  router.route('/file/*?')
    .all(splatFilepath)
    .get(function(req, res, next) {
      fs.readFile(req.filepath, {encoding: 'utf8'}, function(error, data) {
        if(error) return next(error);
        res.json({ok: true, content: data});
      });
    })
    .post(function(req, res, next) {
      mkdirp(path.dirname(req.filepath), function(error) {
        if(error) return next(error);
        fs.writeFile(req.filepath, req.body.content, function(error) {
          if(error) return next(error);
          next();
        });
      });
    })
    .put(function(req, res, next) {
      if(req.body.rename && req.body.filepath) {
        var destpath = filepath(req.body.filepath);
        mkdirp(path.dirname(destpath), function(error) {
          if(error) return next(error);
          fs.rename(req.filepath, destpath, function(error) {
            if(error) return next(error);
            next()
          });
        });
      } else {
        fs.writeFile(req.filepath, req.body.content, function(error) {
          if(error) return next(error);
          next();
        });
      }
    })
    .delete(function(req, res, next) {
      fs.unlink(req.filepath, function(error) {
        if(error) return next(error);
        next()
      });
    })
    .all(hotReload);

  router.route('/build')
    .post(function(req, res, next) {
      var beforeTime = Date.now();
      smithsonian.build(function(error) {
        if(error) return next(error);
        res.json({
          ok: true,
          message: 'Smithonsian has successfully built.',
          buildTime: Date.now() - beforeTime,
        });
      });
    });

  return router;
}

module.exports = api;

