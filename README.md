Smithsonian
===========

Smithsonian is a web interface for [Metalsmith](https://github.com/segmentio/metalsmith). If you are already using Metalsmith, adopting Smithsonian could not be easier. Smithsonian extends Metalsmith so the exact same plugin/middleware system works, just swap out Metalsmith for Smithsonian.

```javascript
Metalsmith = require('metalsmith');
Metalsmith(__dirname)
  .use(markdown())
  .use(templates('handlebars'))
  .build();
```

..becomes..

```javascript
Smithsonian = require('smithsonian');
Smithsonian(__dirname)
  .use(markdown())
  .use(templates('handlebars'))
  .build() // still builds as expected
  .listen(8080); // listening on localhost:8080
```

Note: Smithsonian calls `build()` internally when `listen()` is called.

## Installation

```bash
npm install smithsonian
```

## Usage

Smithsonian can be used as an Express application or as an Express middleware and router inside of an existing Express application. Smithsonian is designed to be completely detached from the rest of the application so there are no side-effects to incorporating Smithsonian into a project.

### Express Server

```javascript
var Smithsonian = require('smithsonian');
Smithsonian(__dirname).listen(3000);
```

### Express Router

```javascript
var express = require('express'),
    Smithsonian = require('smithsonian');

express()
    .use('/subdirectory', Smithsonian(__dirname).router())
    .listen(3000);
```

## Use Cases

Smithsonian is really just a basic file explorer that only works with a Metalsmith source directory. It does not serve the built files; use [http-server](https://github.com/nodeapps/http-server) for that. Smithsonian is really useful for remote deploys and as an administration interface. Smithsonian is like an extremely minimal CMS, but for Metalsmith.

Say you have Metalsmith building static content behind Nginx. Expose Smithsonian (preferably backed by [forever](https://github.com/nodejitsu/forever)) in the Nginx config and you now have an easily accessible adminstration tool to create, edit, and delete source files. No need to build locally and deploy with git or any other manual tool.

Building a simple blog for a company/client? As long as they can handle YAML being at the top of the file, Smithsonian is good enough to hand off to clients.

## Methods

Smithsonian only exposes the plugin system of Metalsmith, which are only `#use()` and `#build()`. All other methods calls outside of Metalsmith plugins will need to use `Smithsonian.metalsmith` which is Smithsonian's Metalsmith instance.

Smithsonian also exposes `#listen()` which will start the web server that serves the interface and `#router()` which returns the Express router middleware.

For error handling, Smithsonian has an overridable `#error()` method that will receive any and all errors that come from Smithsonian. This is great for debugging.

## Screenshots

![List View](https://raw.github.com/andrejewski/smithsonian/master/screenshots/list-view.jpeg)
![File View](https://raw.github.com/andrejewski/smithsonian/master/screenshots/file-view.jpeg)

## Configuration

Smithsonian is configurable.

- `name String` displays in the navbar. Good for custom branding like project or company names
- `hotBuild Boolean` whether or not to build on every file create, update, or delete
- `publicPath String` is the directory serving the CSS files
- `viewPath String` maps to Express's `#set 'views'`, is the directory for template files.
- `viewEngine String` maps to Express's `#set 'view engine'`
- `viewOptions Object` maps to Express's `#set 'view options'`

## Fin

Thanks for using Smithsonian. Or for at least reading this far down into the README.

Follow me on [Twitter](https://twitter.com/compooter) for updates or just for the lolz and please check out my other [repositories](https://github.com/andrejewski) if I have earned it. I thank you for reading.


