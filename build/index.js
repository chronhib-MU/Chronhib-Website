"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importStar(require("express"));
var http_1 = __importDefault(require("http"));
var path_1 = __importDefault(require("path"));
var cors_1 = __importDefault(require("cors"));
var mysql_1 = __importDefault(require("mysql"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var dotenv_1 = __importDefault(require("dotenv"));
var compression_1 = __importDefault(require("compression"));
var helmet_1 = __importDefault(require("helmet"));
var log4js_1 = __importDefault(require("log4js"));
var auth_1 = require("./models/auth");
var commands_1 = require("./models/commands");
var tableDataQuery_1 = require("./models/tableDataQuery");
var currentDate = new Date();
var formattedDate = "-" + String(currentDate.getMonth() + 1).padStart(2, '0') + "-" + currentDate.getFullYear();
log4js_1.default.configure({
    appenders: { node: { type: 'file', filename: "logs/node" + formattedDate + ".log" } },
    categories: { default: { appenders: ['node'], level: 'info' } }
});
var logger = log4js_1.default.getLogger('node');
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
logger.trace("dirname " + path_1.default.dirname(__filename));
// console.log(__dirname);
logger.trace(__dirname);
var result = dotenv_1.default.config();
if (result.error) {
    console.log(result.error);
    logger.error(result.error);
    throw result.error;
}
// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
var node_env = process.env.NODE_ENV || ((_a = result.parsed) === null || _a === void 0 ? void 0 : _a.NODE_ENV);
var port = process.env.PORT || ((_b = result.parsed) === null || _b === void 0 ? void 0 : _b.PORT);
var host = process.env.HOST || ((_c = result.parsed) === null || _c === void 0 ? void 0 : _c.HOST);
var user = process.env.USER || ((_d = result.parsed) === null || _d === void 0 ? void 0 : _d.USER);
var password = process.env.PASSWORD || ((_e = result.parsed) === null || _e === void 0 ? void 0 : _e.PASSWORD);
var database = process.env.DATABASE || ((_f = result.parsed) === null || _f === void 0 ? void 0 : _f.DATABASE);
// console.table({ port, host, password, database, node_env, user, jwt_secret, jwt_expires_in, jwt_cookie_expires });
var app = express_1.default();
var server = http_1.default.createServer(app);
var tableNames = [
    'TEXT',
    'SENTENCES',
    'MORPHOLOGY',
    'LEMMATA'
];
var tables = {
    text: 'SELECT * FROM `TEXT` ORDER BY `Sort_ID` ASC LIMIT 100',
    sentences: 'SELECT * FROM `SENTENCES` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID` ASC LIMIT 100',
    morphology: 'SELECT * FROM `MORPHOLOGY` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID`, `ID` ASC LIMIT 100',
    lemmata: 'SELECT * FROM `LEMMATA` ORDER BY `Lemma` COLLATE utf8mb4_unicode_ci , `Sort_ID` ASC LIMIT 100'
};
var dbconfig = {
    host: host,
    user: user,
    password: password,
    database: database
};
var connection = mysql_1.default.createConnection(dbconfig);
connection.connect(function (err) {
    if (err) {
        logger.error('Error: ', err);
        console.log(err);
    }
});
var tableStructures = {};
connection.query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = ? AND TABLE_SCHEMA = ?', ['BASE TABLE', database], function (err, results) {
    if (err) {
        logger.error(err);
    }
    else {
        // Adds new tables that haven't been hard-coded yet
        results.filter(function (result) { return !(['USERS', 'SEARCH', 'TEAM'].concat(tableNames).includes(result['TABLE_NAME'])); }).forEach(function (table) {
            tableNames.push(table['TABLE_NAME']);
            tables[table['TABLE_NAME'].toLowerCase()] = 'SELECT * FROM `' + table['TABLE_NAME'] + '` ORDER BY `Sort_ID` ASC LIMIT 100';
        });
        console.log("Table Name:", tableNames);
        tableNames.forEach(function (name) {
            tableStructures[name] = {};
            connection.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [database, name], function (err, results) {
                if (err) {
                    logger.error(err);
                    return err;
                }
                else {
                    // console.log('Table Column Structure', results);
                    var nullColumns_1 = ['ID', 'Sort_ID'];
                    var columns = results.map(function (result) { return result.COLUMN_NAME; });
                    columns.forEach(function (column) {
                        tableStructures[name][column] = nullColumns_1.includes(column) ? null : '';
                    });
                    return;
                }
            });
        });
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
var folderLoc = '../client/dist/'; // .. accounts for the build folder
// console.log('Static Folder:', path.join(__dirname, folderLoc));
var appName = 'chronhibWebsite';
console.log('App Name:', appName);
logger.info('App Name:', appName);
app.use(express_1.json({ limit: '50mb' }));
app.use(express_1.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000 }));
app.use(cookie_parser_1.default());
app.use(compression_1.default()); // Compress all routes
app.use(helmet_1.default()); // Protect against well known vulnerabilities
// Serve the static files from the Angular app
app.use("/" + appName + "/", express_1.default.static(path_1.default.join(__dirname, folderLoc)));
app.use("/" + appName + "/assets/", express_1.default.static(path_1.default.join(__dirname, folderLoc + 'assets/')));
app.use(cors_1.default()).use(express_1.default.json());
app.post("/" + appName + "/register", function (req, res, next) {
    var _a = req.body, firstName = _a.firstName, lastName = _a.lastName, email = _a.email, password = _a.password;
    auth_1.register(logger, connection, firstName, lastName, email, password, res, next);
});
app.post("/" + appName + "/login", function (req, res) {
    var _a = req.body, email = _a.email, password = _a.password;
    auth_1.login(logger, connection, email, password, res);
});
app.post("/" + appName + "/isLoggedIn", function (req, res) {
    auth_1.isLoggedIn(logger, connection, req.body.token, res);
});
app.patch("/" + appName + "/api/profileUpdate/", function (req, res, next) {
    console.log('PATCH Variable: ', req.body);
    logger.info('PATCH Variable: ', req.body);
    var _a = req.body, id = _a.id, name = _a.name, email = _a.email, position = _a.position, social_media = _a.social_media, description = _a.description, token = _a.token;
    commands_1.updateProfile(connection, logger, id, name, email, position, description, social_media, token, res, next);
});
app.patch("/" + appName + "/api/rows/", function (req, res, next) {
    console.log('PATCH Variable: ', req.body);
    logger.info('PATCH Variable: ', req.body);
    var _a = req.body, command = _a.command, values = _a.values, user = _a.user, token = _a.token;
    var table = req.body.table.toUpperCase();
    switch (command) {
        case 'moveRow':
            commands_1.moveRow(connection, logger, table, values, user, token, res, next);
            break;
        case 'updateRow':
            commands_1.updateRow(connection, logger, table, values, token, res, next);
            break;
        default:
            break;
    }
});
app.delete("/" + appName + "/api/rows/", function (req, res, next) {
    console.log('DELETE Variable: ', req.query);
    logger.info('DELETE Variable: ', req.query);
    var _a = req.query, values = _a.values, token = _a.token;
    if (Array.isArray(values) && typeof req.query.table === 'string' && typeof token === 'string') {
        var table = req.query.table.toUpperCase();
        commands_1.removeRow(connection, logger, table, values, token, res, next);
    }
    else {
        logger.error({ Message: "Table expected for deletion.", Object: req.query.table, User: req.query.user });
        res.send({ Message: "Table expected for deletion.", Object: req.query.table, User: req.query.user });
    }
});
app.post("/" + appName + "/api/rows/", function (req, res, next) {
    console.log('POST Variable: ', req.body);
    logger.info('POST Variable: ', req.body);
    var _a = req.body, values = _a.values, user = _a.user, token = _a.token;
    var table = req.body.table.toUpperCase();
    commands_1.createRow(connection, logger, table, tableStructures, values, user, token, res, next);
});
app.post("/" + appName + "/api/searchQuery/", function (req, res, next) {
    console.log('POST Variable: ', req.body);
    logger.info('POST Variable: ', req.body);
    var _a = req.body, query = _a.query, creator = _a.creator;
    commands_1.insertSearchQuery(connection, logger, query, creator, res, next);
});
app.get("/" + appName + "/api/search/", function (req, res, next) {
    console.table(req.query);
    logger.trace(req.query);
    tableDataQuery_1.searchTable(connection, logger, req.query, res, next);
});
// Handles all the advanced get api table queries
app.get("/" + appName + "/api/tables/", function (req, res, next) {
    console.table(req.query);
    logger.trace(req.query);
    tableDataQuery_1.navigateTable(connection, logger, req.query, res, next);
});
app.get("/" + appName + "/api/tableColumnRows/", function (req, res, next) {
    console.table(req.query);
    logger.trace(req.query);
    if (typeof req.query.table === 'string' &&
        typeof req.query.column === 'string' &&
        (typeof req.query.filter === 'string' || req.query.filter === null)) {
        var _a = req.query, table = _a.table, column = _a.column, filter = _a.filter;
        tableDataQuery_1.getTableColumnRows(connection, logger, table, column, filter, res, next);
    }
    else {
        logger.error('Error: ', req.query);
        res.status(404).send({
            data: []
        });
    }
});
// Gets all the Team Members from the database
app.get("/" + appName + "/api/allTeamMembers", function (_req, res, next) {
    var query = 'SELECT * FROM TEAM;';
    connection.query(query, function (err, results) {
        if (err) {
            logger.error(err);
            next(err);
        }
        else {
            results.map(function (result) {
                // const arr = new Uint8Array(result.Image) //if it's an ArrayBuffer
                var content = result.Image.toString();
                if (content) {
                    var ImageURL = 'data:image/png;base64,' + result.Image.toString();
                    // console.log(ImageURL);
                    result.ImageURL = ImageURL;
                }
                else {
                    result.ImageURL = '';
                }
                return result;
            });
            // console.log(results);
            // logger.info(results);
            res.status(200).send({
                data: results
            });
        }
    });
});
// Gets the table headers / column names
app.get("/" + appName + "/api/:path/headers", function (req, res, next) {
    // console.log(req.params.path);
    var path = req.params.path;
    if (tableNames.includes(path.toUpperCase())) {
        tableDataQuery_1.getHeaders(connection, logger, path, database, res, next);
    }
    else {
        res.status(404).send({
            data: []
        });
    }
});
app.get("/" + appName + "/api/tableNames", function (_req, res) {
    res.status(200).send({
        data: tableNames
    });
});
// Gets the Table Data for the picture tables T,S,M,L
app.get("/" + appName + "/api/:path", function (req, res, next) {
    // console.log(req.params.path);
    var path = req.params.path;
    console.log(path);
    // logger.trace(req.params.path);
    if (tableNames.includes(path.toUpperCase())) {
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
        res.redirect("/" + appName + "/*"); // redirect back to the homepage
    }
});
// redirect all the routes to the app and lets angular handle the routing
app.get("/" + appName + "/*", function (_req, res) {
    res.sendFile(path_1.default.resolve(__dirname, folderLoc + 'index.html'));
});
if ((node_env === null || node_env === void 0 ? void 0 : node_env.toLowerCase()) === 'production') {
    server.listen(function () { return console.log("Chronhib server is running at http://chronhib.mucampus.net/" + appName + "/"); });
}
else {
    server.listen(port, function () { return console.log("Chronhib server is running at " + host + ":" + port + "/" + appName + "/"); });
}
//# sourceMappingURL=index.js.map