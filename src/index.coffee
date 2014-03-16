# index.coffee

fs 			= require 'fs'
path 		= require 'path'
express 	= require 'express'
session 	= require 'cookie-session'
defaults 	= require 'defaults'
bodyParser 	= require 'body-parser'
Metalsmith 	= require 'metalsmith'

Smithsonian = (dir) ->
	return new Smithsonian dir if !(@ instanceof Smithsonian)
	@metalsmith = Metalsmith dir
	@options {}
	@

# Metalsmith interface

Smithsonian::use = (ware) ->
	@metalsmith.use ware
	@

Smithsonian::build = (next) ->
	@metalsmith.build next
	@

# Express interface

Smithsonian::options = (options) ->
	return @_options if arguments.length == 0
	root = path.normalize __dirname + '/..'
	@_options = defaults options, 
		appName: 'Smithsonian'
		auth: false
		authKeys:
			username: 'admin'
			password: 'password'
		autoBuild: false
		credits: true
		extension: 'md'
		filename: (name, ext) ->
			date = new Date Date.now()
			y = date.getFullYear()
			m = date.getMonth() + 1
			d = date.getDate()
			desc = name.toLowerCase().split(' ').join('-')
			"#{y}-#{m}-#{d}-#{desc}.#{ext}"
		filedata: (name, ext) ->
			timestamp = do ->
				date = new Date Date.now()
				y = date.getFullYear()
				m = date.getMonth() + 1
				d = date.getDate()
				hr = date.getHours() + 1
				mn = date.getMinutes() + 1
				sc = date.getSeconds() + 1
				"#{y}-#{m}-#{d} #{hr}:#{mn}:#{sc}"
			"""
			---
			title: "#{name}"
			date: #{timestamp}
			template: post.jade
			---
			"""
		handleError: (error) -> throw error if error
		namespace: ''
		sessionKeys: ['undercover', 'renegade']
		static: root+'/public'
		views: root+'/view'
		viewEngine: 'jade'
		viewOptions: {layout: false, self: true}
	@

Smithsonian::server = ->
	options = @options()
	ns = (x) -> options.namespace + x
	{handleError} = options
	autoBuild = (next = ->) -> 
		return @build next if options.autoBuild
		next null
	srcDir = @metalsmith.source()
	destDir = @metalsmith.destination()
	dir = (path) -> "#{srcDir}/#{path}"

	@app = express()
		.set 'views', options.views
		.set 'view engine', options.viewEngine
		.set 'view options', options.viewOptions
		.use (ns '/'), express.static options.static
		.use session keys: options.sessionKeys
		.use bodyParser()

	all 		= ns '*'
	index 		= ns '/'
	create 		= ns '/file'
	resource 	= ns '/file/:name'

	@app.all all, (req, res, next) ->
			req.session.authed = true if !options.auth
			res.locals.appName = options.appName
			res.locals.credits = options.credits
			res.locals.autoBuild = options.autoBuild
			res.locals.ns = ns
			next()

	@app.get index, (req, res, next) -> 
			return next 'route' if req.session.authed
			res.render 'login'
	@app.post index, (req, res, next) ->
			return next 'route' if req.session.authed
			if options.authKeys.username != req.body.username
				return res.render 'login', {e: 0, error: 'Incorrect username.'}
			if options.authKeys.password != req.body.password
				return res.render 'login', {e: 1, error: 'Incorrect password.'}
			req.session.authed = true
			next()

	@app.all all, (req, res, next) ->
		return res.status(500).send 'Not Authenicated.' if !req.session.authed
		res.locals.authed = req.session.authed && options.auth
		next()

	@app.all index, (req, res, next) ->
			# display directory
			fs.readdir srcDir, (error, filenames) ->
				handleError error
				res.locals.filenames = filenames
				res.render 'list'

	@app.post create, (req, res, next) ->
			# create file
			return next() if !name = req.body.name
			filename = options.filename name, options.extension
			filedata = options.filedata name, options.extension
			fs.writeFile (dir filename), filedata, (error) ->
				handleError error
				res.redirect (ns "/file/#{filename}")
				autoBuild()
	
	@app.get resource, (req, res, next) ->
			# display file
			return next() if !name = req.params.name
			fs.readFile (dir name), (error, data) ->
				handleError error
				res.render 'file', {name, data}
	@app.post resource, (req, res, next) ->
			return update req, res, next if req.body.action == 'update'
			return remove req, res, next if req.body.action == 'delete'
			next()

	rename = (currName, nextName, next) ->
			return next null, currName, false if !nextName || currName == nextName
			fs.rename (dir currName), (dir nextName), (error) ->
				handleError error
				next error, nextName, true
	update = (req, res, next) ->
			return next() if !currName = req.params.name
			{name, data} = req.body
			return next() unless name && data
			rename currName, name, (error, name, renamed) ->
				fs.writeFile (dir name), data, (error) ->
					handleError error
					if renamed
						res.redirect (ns "/file/#{name}")
						cleanDest currName
					else
						res.render 'file', {name, data}
					autoBuild()
	remove = (req, res, next) ->
			# delete file
			return next() if !name = req.params.name
			fs.unlink (dir name), (error) ->
				handleError error
				res.redirect index
				autoBuild()
			cleanDest name

	cleanDest = (filename, next = ->) ->
		fs.unlink "#{destDir}/#{filename}", (error) ->
			# ignore error because `dest` may not have been built yet
			next error

	@app.get (ns '/build'), (req, res, next) => @build ->
			res.redirect index

	@app.get (ns '/logout'), (req, res, next) ->
			req.session = null
			res.redirect index

Smithsonian::listen = ->
	args = arguments
	@server()
	@build => @app.listen.apply @app, args

module.exports = Smithsonian
