const winston = require('winston');

const config = require('../config/config');

const logger = winston.createLogger({
	exitOnError: false,
	transports: [
		new winston.transports.File({
			filename: './logs/error.log'
		})
	],
	exceptionHandlers: [
		new winston.transports.File({filename: './logs/exceptions.log'})
	]
});

if (process.env.NODE_ENV == 'development') {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}))
}

exports.logger = logger;
