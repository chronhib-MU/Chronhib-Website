import express, { json, urlencoded } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import log4js from 'log4js';
import { register, login, isLoggedIn } from './models/auth';
import { createRow, insertSearchQuery, moveRow, removeRow, updateRow, updateProfile } from './models/commands';
import { getHeaders, getTableColumnRows, navigateTable, searchTable } from './models/tableDataQuery';
const currentDate = new Date();
const formattedDate = `-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
log4js.configure({
  appenders: { node: { type: 'file', filename: `logs/node${formattedDate}.log` } },
  categories: { default: { appenders: ['node'], level: 'info' } }
});

const logger: log4js.Logger = log4js.getLogger('node');
// Quick Reference for logger:
// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Comté.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');
// console.log(`pathname ${__filename}`);
// console.log(`dirname ${path.dirname(__filename)}`);
logger.trace(`pathname ${__filename}`);
logger.trace(`dirname ${path.dirname(__filename)}`);

// console.log(__dirname);
logger.trace(__dirname);
const result = dotenv.config();
if (result.error) {
  console.log(result.error);
  logger.error(result.error);
  throw result.error;
}

// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
const node_env = process.env.NODE_ENV || result.parsed?.NODE_ENV;
const port = process.env.PORT || result.parsed?.PORT;
const host = process.env.HOST || result.parsed?.HOST;
const user = process.env.USER || result.parsed?.USER;
const password = process.env.PASSWORD || result.parsed?.PASSWORD;
const database = process.env.DATABASE || result.parsed?.DATABASE;
// console.table({ port, host, password, database, node_env, user, jwt_secret, jwt_expires_in, jwt_cookie_expires });

const app = express();
const server = http.createServer(app);

const tableNames = [
  'TEXT',
  'SENTENCES',
  'MORPHOLOGY',
  'LEMMATA'
]

const tables: { [key: string]: string } = {
  text: 'SELECT * FROM `TEXT` ORDER BY `Sort_ID` ASC LIMIT 100',
  sentences: 'SELECT * FROM `SENTENCES` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID` ASC LIMIT 100',
  morphology: 'SELECT * FROM `MORPHOLOGY` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID`, `ID` ASC LIMIT 100',
  lemmata: 'SELECT * FROM `LEMMATA` ORDER BY `Lemma` COLLATE utf8mb4_unicode_ci , `Sort_ID` ASC LIMIT 100'
};

const dbconfig = {
  host,
  user,
  password,
  database
};
const connection: mysql.Connection = mysql.createConnection(dbconfig);

connection.connect((err) => {
  if (err) {
    logger.error('Error: ', err);
    console.log(err);

  }
});

const tableStructures: { [key: string]: { [key: string]: string | null; }; } = {};

connection.query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = ? AND TABLE_SCHEMA = ?', ['BASE TABLE', database], (err, results) => {
  if (err) {
    logger.error(err);
  } else {
    // Adds new tables that haven't been hard-coded yet
    results.filter((result: { [x: string]: string; }) => !(['USERS', 'SEARCH', 'TEAM'].concat(tableNames).includes(result['TABLE_NAME']))).forEach((table: { [x: string]: string; }) => {
      tableNames.push(table['TABLE_NAME']);
      tables[table['TABLE_NAME'].toLowerCase()] = 'SELECT * FROM `' + table['TABLE_NAME'] + '` ORDER BY `Sort_ID` ASC LIMIT 100';
    });
    console.log("Table Name:", tableNames);
    tableNames.forEach(name => {
      tableStructures[name] = {};
      connection.query('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [database, name], (err, results) => {
        if (err) {
          logger.error(err);
          return err;
        } else {
          // console.log('Table Column Structure', results);
          const nullColumns = ['ID', 'Sort_ID'];
          const columns = results.map((result: { COLUMN_NAME: string; }) => result.COLUMN_NAME);
          columns.forEach((column: string) => {
            tableStructures[name][column] = nullColumns.includes(column) ? null : '';
          })
          return;
        }
      });
    })
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
const folderLoc = '../client/dist/'; // .. accounts for the build folder
// console.log('Static Folder:', path.join(__dirname, folderLoc));

const appName = 'chronhibWebsite';
console.log('App Name:', appName);
logger.info('App Name:', appName);
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000 }));
app.use(cookieParser());
app.use(compression()); // Compress all routes
app.use(helmet()); // Protect against well known vulnerabilities
// Serve the static files from the Angular app
app.use(`/${appName}/`, express.static(path.join(__dirname, folderLoc)));
app.use(`/${appName}/assets/`, express.static(path.join(__dirname, folderLoc + 'assets/')));

app.use(cors()).use(express.json());

app.post(`/${appName}/register`, (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  register(logger, connection, firstName, lastName, email, password, res, next);
});

app.post(`/${appName}/login`, (req, res) => {
  const { email, password } = req.body;
  login(logger, connection, email, password, res);
});

app.post(`/${appName}/isLoggedIn`, (req, res): void => {
  isLoggedIn(logger, connection, req.body.token, res);
});

app.patch(`/${appName}/api/profileUpdate/`, (req, res, next) => {
  console.log('PATCH Variable: ', req.body);
  logger.info('PATCH Variable: ', req.body);
  const { id, name, email, position, social_media, description, token } = req.body;
  updateProfile(connection, logger, id, name, email, position, description, social_media, token, res, next);
});
app.patch(`/${appName}/api/rows/`, (req, res, next) => {
  console.log('PATCH Variable: ', req.body);
  logger.info('PATCH Variable: ', req.body);
  const { command, values, user, token } = req.body;
  const table = req.body.table.toUpperCase();
  switch (command) {
    case 'moveRow':
      moveRow(connection, logger, table, values, user, token, res, next);
      break;
    case 'updateRow':
      updateRow(connection, logger, table, values, token, res, next);
      break;
    default:
      break;
  }
});

app.delete(`/${appName}/api/rows/`, (req, res, next) => {
  console.log('DELETE Variable: ', req.query);
  logger.info('DELETE Variable: ', req.query);

  const { values, token } = req.query as { [key: string]: string | string[] };

  if (Array.isArray(values) && typeof req.query.table === 'string' && typeof token === 'string') {
    const table = req.query.table.toUpperCase();
    removeRow(connection, logger, table, values, token, res, next);
  } else {
    logger.error({ Message: "Table expected for deletion.", Object: req.query.table, User: req.query.user })
    res.send({ Message: "Table expected for deletion.", Object: req.query.table, User: req.query.user })
  }
});

app.post(`/${appName}/api/rows/`, (req, res, next) => {
  console.log('POST Variable: ', req.body);
  logger.info('POST Variable: ', req.body);
  const { values, user, token } = req.body;
  const table = req.body.table.toUpperCase();

  createRow(connection, logger, table, tableStructures, values, user, token, res, next);
});

app.post(`/${appName}/api/searchQuery/`, (req, res, next) => {
  console.log('POST Variable: ', req.body);
  logger.info('POST Variable: ', req.body);
  const { query, creator } = req.body
  insertSearchQuery(connection, logger, query, creator, res, next);
});


app.get(`/${appName}/api/search/`, (req, res, next) => {
  console.table(req.query);
  logger.trace(req.query);
  searchTable(connection, logger, req.query, res, next);
});

// Handles all the advanced get api table queries
app.get(`/${appName}/api/tables/`, (req, res, next) => {
  console.table(req.query);
  logger.trace(req.query);
  navigateTable(connection, logger, req.query, res, next);
});

app.get(`/${appName}/api/tableColumnRows/`, (req, res, next) => {
  console.table(req.query);
  logger.trace(req.query);
  if (
    typeof req.query.table === 'string' &&
    typeof req.query.column === 'string' &&
    (typeof req.query.filter === 'string' || req.query.filter === null)
  ) {
    const { table, column, filter } = req.query;
    getTableColumnRows(connection, logger, table, column, filter, res, next);
  } else {
    logger.error('Error: ', req.query);
    res.status(404).send({
      data: []
    });
  }
});

// Gets all the Team Members from the database
app.get(`/${appName}/api/allTeamMembers`, (_req, res, next) => {
  const query = 'SELECT * FROM TEAM;'
  connection.query(query, (err, results) => {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      results.map((result: { Image: Buffer; ImageURL: string; }) => {
        // const arr = new Uint8Array(result.Image) //if it's an ArrayBuffer
        const content = result.Image.toString();
        if (content) {
          const ImageURL = 'data:image/png;base64,' + result.Image.toString();
          // console.log(ImageURL);
          result.ImageURL = ImageURL;
        } else { result.ImageURL = ''; }
        return result;
      })
      // console.log(results);
      // logger.info(results);
      res.status(200).send({
        data: results
      });
    }
  })
});


// Gets the table headers / column names
app.get(`/${appName}/api/:path/headers`, (req, res, next) => {
  // console.log(req.params.path);
  const path = req.params.path;
  if (tableNames.includes(path.toUpperCase())) {
    getHeaders(connection, logger, path, database, res, next);
  } else {
    res.status(404).send({
      data: []
    });
  }
});

app.get(`/${appName}/api/tableNames`, (_req, res) => {
  res.status(200).send({
    data: tableNames
  });
});

// Gets the Table Data for the picture tables T,S,M,L
app.get(`/${appName}/api/:path`, (req, res, next) => {
  // console.log(req.params.path);
  const path = req.params.path;
  console.log(path);
  // logger.trace(req.params.path);
  if (tableNames.includes(path.toUpperCase())) {
    connection.query(tables[path], (err, results) => {
      if (err) {
        logger.error(err);
        next(err);
      } else {
        // console.log(results);
        // logger.info(results);
        res.status(200).send({
          data: { beforeTable: [], afterTable: results }
        });
      }
    });
  } else {
    // Handles any requests that don't match the ones above
    res.redirect(`/${appName}/*`); // redirect back to the homepage
  }
});

// redirect all the routes to the app and lets angular handle the routing
app.get(`/${appName}/*`, (_req, res) => {
  res.sendFile(path.resolve(__dirname, folderLoc + 'index.html'));
});


if (node_env?.toLowerCase() === 'production') {
  server.listen(() => console.log(`Chronhib server is running at http://chronhib.mucampus.net/${appName}/`));
} else {
  server.listen(port, () => console.log(`Chronhib server is running at ${host}:${port}/${appName}/`));
}