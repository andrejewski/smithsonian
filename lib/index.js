
var path = require('path'),
	defaults = require('defaults'),
	express = require('express'),
	Metalsmith = require('metalsmith');

var Router = require('./router'),
	pkgRoot = path.normalize(__dirname + '/..');

module.exports = Smithsonian;

function Smithsonian(dir, options) {
	if(!(this instanceof Smithsonian)) {
		return new Smithsonian(dir, options);
	}
	this.metalsmith = Metalsmith(dir);
	this.options = defaults(options, {
		name: path.basename(dir),
		hotBuild: false,
		defaultFilename: defaultFilename,
		defaultFileContent: defaultFileContent,
		publicPath: path.join(pkgRoot, 'public'),
		viewPath: path.join(pkgRoot, 'view'),
		viewEngine: 'jade'
	});
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
	return Router(this);
}

Smithsonian.prototype.listen = function(port) {
	var _this = this;
	port = port || +process.env.port;
	this.build(function(error) {
		if(error) return _this.error(error);
		express()
			.use(_this.router())
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

function defaultFilename(name) {
	var extension = '.md',
		now = new Date(),
		dateStamp = [
			now.getFullYear(),
			1+now.getMonth(),
			now.getDate()
		],
		basename = dateStamp.concat(name.toLowerCase().split(" ")).join("-");
	return basename+extension;
}

function defaultFileContent(name) {
	function timestamp() {
		var now = new Date();
		return [
			[now.getFullYear(), 1+now.getMonth(), now.getDate()].join('-'),
			[1+now.getHours(), 1+now.getMinutes(), 1+now.getSeconds()].join(':')
		].join(' ');
	}

	return [
		"---",
		"title: "+name,
		"date: "+timestamp(),
		"template: post.jade",
		"---"
	].join('\n');
}
