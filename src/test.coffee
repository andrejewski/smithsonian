# test.coffee

Smithsonian = require './index'

Smithsonian './test'
	.options
		appName: 'Custom Admin Title'
		auth: false
		authKeys:
			username: 'superuser'
			password: 'password'
		namespace: '/admin'
	.listen 8080