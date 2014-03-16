Smithsonian
===========

![List View](https://raw.github.com/andrejewski/smithsonian/master/screenshots/list-view.png)

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

## Use Cases

Smithsonian is really just a basic file explorer that only works with a Metalsmith source directory. It does not serve the built files; use [http-server](https://github.com/nodeapps/http-server) for that. Smithsonian is really useful for remote deploys and as an administration interface. Smithsonian is like an extremely minimal CMS, but for Metalsmith.

Say you have Metalsmith building static content behind Nginx. Expose Smithsonian (preferably backed by [forever](https://github.com/nodejitsu/forever)) in the Nginx config and you now have an easily accessible adminstration tool to create, edit, and delete source files. No need to build locally and deploy with git or any other manual tool.

Building a simple blog for a company/client? As long as they can handle YAML being at the top of the file, Smithsonian is good enough to hand off to clients.

## Methods

Smithsonian only exposes the plugin system of Metalsmith, which are only `use()` and `build()`. All other methods calls outside of Metalsmith plugins will need to use `Smithsonian.metalsmith` which is Smithsonian's Metalsmith instance.

Smithsonian also exposes `options()` which can override Smithsonian defaults (see Configuration) and `listen()` which will start the web server that serves the interface.

## Screenshots

![List View](https://raw.github.com/andrejewski/smithsonian/master/screenshots/list-view.png)
![File View](https://raw.github.com/andrejewski/smithsonian/master/screenshots/file-view.png)
![Login View](https://raw.github.com/andrejewski/smithsonian/master/screenshots/login-view.png)

## Configuration

Smithsonian is very configurable. Need authenication? See `auth` and `authKeys`. Don't want to serve from root? See `namespace`. Don't like the default CSS? See `static`. Don't like the default HTML? See `views`, `viewEngine`, and `viewOptions`. Don't like pretty much anything? Change it.

- `appName String` displays in the navbar and footer. Good for custom branding like project or company names.
- `auth Boolean` whether to use authenication
- `authKeys Object` hash containing username/password
- `autoBuild Boolean` whether or not to build on every file create, update, or delete
- `credits Boolean` whether to show links to Smithsonian on Github
- `extension String` what file extension to use for new files
- `filename Function` generates a filename, given the user supplied name and the extension
- `filedata Function` generates the default file contents given, given the user supplied name and the extension
- `namespace String` if set to, say, "/admin" would serve everything Smithsonian through `localhost:8080/admin/`
- `sessionKeys Array[String]` are used in initializing Express's cookie-session
- `static String` is the directory serving the favicon.ico and CSS files
- `views String` maps to Express's `#set 'view engine'`, is the directory for template files. 
- `viewEngine String` maps to Express's `#set 'view engine'`
- `viewOptions Object` maps to Express's `#set 'view options'`

Here are all of the override-able defaults.

```javascript
{
      appName: 'Smithsonian',
      auth: false,
      authKeys: {
        username: 'admin',
        password: 'password'
      },
      autoBuild: false,
      credits: true,
      extension: 'md',
      filename: function(name, ext) {
        var d, date, desc, m, y;
        date = new Date(Date.now());
        y = date.getFullYear();
        m = date.getMonth() + 1;
        d = date.getDate();
        desc = name.toLowerCase().split(' ').join('-');
        return "" + y + "-" + m + "-" + d + "-" + desc + "." + ext;
      },
      filedata: function(name, ext) {
        var timestamp;
        timestamp = (function() {
          var d, date, hr, m, mn, sc, y;
          date = new Date(Date.now());
          y = date.getFullYear();
          m = date.getMonth() + 1;
          d = date.getDate();
          hr = date.getHours() + 1;
          mn = date.getMinutes() + 1;
          sc = date.getSeconds() + 1;
          return "" + y + "-" + m + "-" + d + " " + hr + ":" + mn + ":" + sc;
        })();
        return "---\nlayout: post\ntitle: \"" + name + "\"\ndate: " + timestamp + "\n---";
      },
      namespace: '',
      sessionKeys: ['undercover', 'renegade'],
      "static": path.normalize(__dirname + '/..') + '/public',
      views: path.normalize(__dirname + '/..') + '/view',
      viewEngine: 'jade',
      viewOptions: {
        layout: false,
        self: true
      }
}
```

## Fin

Thanks for using Smithsonian. Or for at least reading this far down into the README.

Check-out my other [repositories](http://github.com/andrejewski) if I've earned it.


