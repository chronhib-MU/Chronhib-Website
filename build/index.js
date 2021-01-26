"use strict";
var express = require('express');
var http = require('http');
var path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var promisify = require('util').promisify;
var dotenv = require('dotenv');
var compression = require('compression');
var helmet = require('helmet');
var parse = require('path').parse;
var log4js = require('log4js');
var serveStatic = require('serve-static');
var qs = require('qs');
var query = require('express').query;
var throws = require('assert').throws;
var auth = require('./models/auth.js');
var commands = require('./models/commands.js');
var tableDataQuery = require('./models/tableDataQuery.js');
var currentDate = new Date();
var formattedDate = "-" + String(currentDate.getMonth() + 1).padStart(2, '0') + "-" + currentDate.getFullYear();
log4js.configure({
    appenders: { node: { type: 'file', filename: "logs/node" + formattedDate + ".log" } },
    categories: { default: { appenders: ['node'], level: 'info' } }
});
var logger = log4js.getLogger('node');
// Quick Reference for logger:
// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Comté.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');
// console.log(`pathname ${__filename}`);
// console.log(`dirname ${path.dirname(__filename)}`);
logger.trace("pathname " + __filename);
logger.trace("dirname " + path.dirname(__filename));
// console.log(__dirname);
logger.trace(__dirname);
var result = dotenv.config();
if (result.error) {
    console.log(result.error);
    logger.error(result.error);
    throw result.error;
}
// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
var _a = result.parsed, NODE_ENV = _a.NODE_ENV, PORT = _a.PORT, HOST = _a.HOST, USER = _a.USER, PASSWORD = _a.PASSWORD, DATABASE = _a.DATABASE;
var port = process.env.PORT || PORT;
var host = process.env.HOST || HOST;
var password = process.env.PASSWORD || PASSWORD;
var database = process.env.DATABASE || DATABASE;
var node_env = process.env.NODE_ENV || NODE_ENV;
var user = process.env.USER || USER;
// console.table({ port, host, password, database, node_env, user, jwt_secret, jwt_expires_in, jwt_cookie_expires });
var app = express();
var server = http.createServer(app);
var tables = {
    text: 'SELECT * FROM `TEXT` ORDER BY `Sort_ID` ASC LIMIT 100',
    lemmata: 'SELECT * FROM `SENTENCES` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID` ASC LIMIT 100',
    morphology: 'SELECT * FROM `MORPHOLOGY` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID`, `ID` ASC LIMIT 100',
    sentences: 'SELECT * FROM `LEMMATA` ORDER BY `Lemma` COLLATE utf8mb4_unicode_ci , `Sort_ID` ASC LIMIT 100'
};
var dbconfig = {
    host: host,
    user: user,
    password: password,
    database: database
};
var connection = mysql.createConnection(dbconfig);
connection.connect(function (err) {
    if (err) {
        logger.error('Error: ', err);
        console.log(err);
        return err;
    }
});
// console.log(connection);
// logger.debug(connection);
// connection.query('SELECT `First_Name`,`Last_Name`,`Email`,`Password` FROM `USERS`', (err, results) => {
//   if (err) {
//     console.log(err);
//     logger.error('Error: ', err);
//   } else {
//     console.table(results);
//     logger.debug(results);
//   }
// });
var folderLoc = 'client/dist/';
// console.log('Static Folder:', path.join(__dirname, folderLoc));
// const appName = __dirname.split(path.sep).pop();
var appName = 'chronhibWebsite';
// console.log('App Name:', appName);
logger.info('App Name:', appName);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000 }));
app.use(cookieParser());
app.use(compression()); // Compress all routes
app.use(helmet()); // Protect against well known vulnerabilities
// Serve the static files from the Angular app
app.use("/" + appName + "/", serveStatic(path.join(__dirname, folderLoc)));
app.use("/" + appName + "/assets/", serveStatic(path.join(__dirname, folderLoc + 'assets/')));
app.use(cors()).use(bodyParser.json());
app.post("/" + appName + "/register", function (req, res, next) {
    auth.register(logger, connection, req, res, next);
});
app.post("/" + appName + "/login", function (req, res) {
    auth.login(logger, connection, req, res);
});
app.post("/" + appName + "/isLoggedIn", function (req, res) {
    auth.isLoggedIn(logger, connection, req.body.token, res);
});
app.patch("/" + appName + "/api/rows/", function (req, res, next) {
    console.log('PATCH Variable: ', req.body);
    logger.trace('PATCH Variable: ', req.body);
    var _a = req.body, table = _a.table, command = _a.command, values = _a.values, user = _a.user, token = _a.token;
    table = table.toUpperCase();
    switch (command) {
        case 'moveRow':
            commands.moveRow(connection, logger, table, values, user, token, res, next);
            break;
        case 'updateRow':
            commands.updateRow(connection, logger, table, values, token, res, next);
            break;
        default:
            break;
    }
});
app.delete("/" + appName + "/api/rows/", function (req, res, next) {
    console.log('DELETE Variable: ', req.body);
    logger.trace('DELETE Variable: ', req.body);
    var _a = req.query, table = _a.table, values = _a.values, token = _a.token;
    table = table.toUpperCase();
    commands.removeRow(connection, logger, table, values, token, res, next);
});
app.post("/" + appName + "/api/rows/", function (req, res, next) {
    console.log('POST Variable: ', req.body);
    logger.trace('POST Variable: ', req.body);
    var _a = req.body, table = _a.table, command = _a.command, values = _a.values, user = _a.user, token = _a.token;
    table = table.toUpperCase();
    commands.createRow(connection, logger, table, values, user, token, res, next);
});
app.post("/" + appName + "/api/searchQuery/", function (req, res, next) {
    console.log('POST Variable: ', req.body);
    logger.trace('POST Variable: ', req.body);
    var _a = req.body, query = _a.query, creator = _a.creator;
    commands.insertSearchQuery(connection, logger, query, creator, res, next);
});
app.get("/" + appName + "/api/search/", function (req, res, next) {
    console.table(req.query);
    logger.trace(req.query);
    tableDataQuery.searchTable(connection, logger, req, res, next);
});
// Handles all the advanced get api table queries
app.get("/" + appName + "/api/tables/", function (req, res, next) {
    console.table(req.query);
    logger.trace(req.query);
    if (typeof req.query.page === 'string' &&
        typeof req.query.limit === 'string' &&
        typeof req.query.fprop === 'string' &&
        typeof req.query.fval === 'string' &&
        typeof req.query.dtable === 'string' &&
        typeof req.query.ctable === 'string') {
        tableDataQuery.navigateTable(connection, logger, req, res, next);
    }
    else {
        console.log(req.query);
        res.send('Go to:<br/>' +
            Object.keys(tables)
                .map(function (path) { return "/" + appName + "/api/" + path + " to see the " + path + " table,"; })
                .join('<br/>'));
    }
});
app.get("/" + appName + "/api/tableColumnRows", function (req, res, next) {
    console.table(req.query);
    logger.trace(req.query);
    if (typeof req.query.table === 'string' &&
        typeof req.query.column === 'string') {
        var _a = req.query, table = _a.table, column = _a.column, filter = _a.filter;
        tableDataQuery.getTableColumnRows(connection, logger, table, column, filter, res, next);
    }
    else {
        res.status(404).send({
            data: []
        });
    }
});
// Gets the table headers / column names
app.get("/" + appName + "/api/:path/headers", function (req, res, next) {
    // console.log(req.params.path);
    var path = req.params.path;
    if (path in tables) {
        tableDataQuery.getHeaders(connection, logger, path, DATABASE, res, next);
    }
    else {
        res.status(404).send({
            data: []
        });
    }
});
// Gets the Table Data for the picture tables T,S,M,L
app.get("/" + appName + "/api/:path", function (req, res, next) {
    // console.log(req.params.path);
    var path = req.params.path;
    // console.log(tables[path]);
    // logger.trace(req.params.path);
    if (path in tables) {
        connection.query(tables[path], function (err, results) {
            if (err) {
                logger.error(err);
                next(err);
            }
            else {
                // console.log(results);
                // logger.info(results);
                res.status(200).send({
                    data: { beforeTable: [], afterTable: results }
                });
            }
        });
    }
    else {
        // Handles any requests that don't match the ones above
        redirect("/" + appName + "/*"); // redirect back to the homepage
    }
});
// redirect all the routes to the app and lets angular handle the routing
app.get("/" + appName + "/*", function (req, res) {
    res.sendFile(path.resolve(__dirname, folderLoc + 'index.html'));
});
if (node_env.toLowerCase() === 'production') {
    server.listen(function () { return console.log("Chronhib server is running at http://chronhib.mucampus.net/" + appName + "/"); });
}
else {
    server.listen(port, function () { return console.log("Chronhib server is running at " + host + ":" + port + "/" + appName + "/"); });
}
//# sourceMappingURL=index.js.map