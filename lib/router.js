
var fs = require('fs'),
	path = require('path'),
	express = require('express'),
	bodyParser = require('body-parser');

module.exports = function(smithsonian) {
	var router = new express.Router()
		.use(express.static(smithsonian.options.publicPath))
		.use(bodyParser.urlencoded({extended: false}))
		.use(bodyParser.json());

	function resolve(filename) {
		var dir = smithsonian.metalsmith.source();
		return path.join(dir, filename);
	}

	function resolveBuild(filename) {
		var dir = smithsonian.metalsmith.destination();
		return path.join(dir, filename);
	}

	function resolveView(view) {
		return path.join(smithsonian.options.viewPath, view)+'.'+smithsonian.options.viewEngine;
	}

	function hotBuild(next) {
		next = next || function(error) {};
		smithsonian.options.hotBuild 
			? smithsonian.build(next)
			: next(null);
	}

	function unstripMountpath(path) {
		var levels = path.split('/') - 1;
		return function(req, res, next) {
			res.locals.routerUrl = req.originalUrl.split('/').slice(0, -levels).join('/') || '/';
			res.locals.link = function(path) {
				return res.locals.routerUrl+path;
			}
			next();
		}
	}

	router.all('*', function(req, res, next) {
		res.locals.s = smithsonian.options;
		req.render = function(name) {
			res.render(resolveView(name));
		}
		next();
	});

	router.route('/')
		.all(unstripMountpath('/'))
		.post(function(req, res, next) {
			hotBuild(next);
		})
		.all(function(req, res, next) {
			fs.readdir(resolve(""), function(error, files) {
				if(error) return next(error);
				res.locals.filenames = files;
				req.render('list');
			});
		});

	router.post('/file', unstripMountpath('/file'), function(req, res, next) {
		var title = req.param('title');
		if(!title) return next(new Error("To create a new file, a file title is required."));
		var filename = smithsonian.options.defaultFilename(title),
			fileData = smithsonian.options.defaultFileContent(title),
			filepath = resolve(filename);
		fs.writeFile(filepath, fileData, function(error) {
			if(error) return next(error);
			res.redirect(res.locals.routerUrl+'file/'+filename);
			hotBuild();
		});
	});

	router.route('/file/:name')
		.all(unstripMountpath('/file/:name'))
		.all(function(req, res, next) {
			var filename = req.param('name');
			res.locals.basename = filename;
			res.locals.filepath = resolve(filename);
			next();
		})
		.post(function(req, res, next) {
			switch(req.body.action) {
				case 'update': return update(req, res, next);
				case 'delete': return remove(req, res, next);
				default: next();
			}
		})
		.all(function(req, res, next) {
			fs.readFile(res.locals.filepath, {encoding: 'utf8'}, function(error, data) {
				if(error) return next(error);
				res.locals.content = data;
				req.render('file');
			});
		});

	return router;

	function rename(src, dest, done) {
		if(!(src && dest) || (src === dest)) return done(null, src, false);
		fs.rename(src, dest, function(error) {
			done(error, dest, true);
		});
	}

	function update(req, res, next) {
		var fullpath = typeof req.body.filename === 'string' 
			? resolve(req.body.filename) 
			: false;
		rename(res.locals.filepath, fullpath, function(error, filepath, renamed) {
			if(error) return next(error);
			res.locals.filepath = filepath;
			if(typeof req.body.content !== 'string') return done(error);
			fs.writeFile(filepath, req.body.content, done);
			
			function done(error) {
				if(error) return next(error);
				hotBuild();
				if(!renamed) return next();
				res.redirect(path.basename(filepath));
			}
		});
	}

	function remove(req, res, next) {
		var srcPath = res.locals.filepath;
		fs.unlink(srcPath, function(error) {
			if(error) return next(error);
			res.redirect(res.locals.routerUrl);
			hotBuild();
		});
	}
}
