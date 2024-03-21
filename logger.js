const winston = require('winston');
// require('winston-daily-rotate-file');

// Define log levels and their colors
const logLevels = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'magenta'
};
// const transport = new winston.transports.DailyRotateFile({
//     filename: 'watssapp-%DATE%.log',
//     datePattern: 'YYYY-MM-DD-HH',
//     zippedArchive: true,
//     maxSize: '20m',
//     maxFiles: '48h' // Automatically delete log files older than  48 hours
//   });

// Configure the logger
const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'whatsapp.log',maxFiles:'48h',maxsize:'20m' })
    ]
});

// Apply custom colors to log levels
winston.addColors(logLevels);

module.exports = logger;