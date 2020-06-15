const express = require('express');
// const serveStatic = require("serve-static");
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const dotenv = require('dotenv');
const compression = require('compression');
const helmet = require('helmet');
const { start } = require('repl');
console.log(`pathname ${__filename}`);
console.log(`dirname ${path.dirname(__filename)}`);

console.log(__dirname);

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
const { NODE_ENV, PORT, HOST, USER, PASSWORD, DATABASE } = result.parsed;

const port = process.env.PORT || PORT;
const host = process.env.HOST || HOST;
const password = process.env.PASSWORD || PASSWORD;
const database = process.env.DATABASE || DATABASE;
const node_env = process.env.NODE_ENV || NODE_ENV;
const user = node_env === 'production' ? process.env.USER : USER;
console.log({ node_env, port, host, user, password, database });
const app = express();
// mysql table queries
const SELECT_ALL_TEXT_QUERY = 'SELECT * FROM TEXT LIMIT 100';
const SELECT_ALL_LEMMATA_QUERY = 'SELECT * FROM LEMMATA LIMIT 100';
const SELECT_ALL_MORPHOLOGY_QUERY = 'SELECT * FROM MORPHOLOGY LIMIT 100';
const SELECT_ALL_SENTENCES_QUERY = 'SELECT * FROM SENTENCES LIMIT 100';

const tables = {
  text: SELECT_ALL_TEXT_QUERY,
  lemmata: SELECT_ALL_LEMMATA_QUERY,
  morphology: SELECT_ALL_MORPHOLOGY_QUERY,
  sentences: SELECT_ALL_SENTENCES_QUERY
};
const connection = mysql.createConnection({
  host,
  user,
  password,
  database
});

connection.connect(err => {
  if (err) {
    return err;
  }
});
// console.log(connection);
// connection.query(tables['text'], (err, results) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('TEXT TABLE: ', {
//       data: results
//     });
//   }
// });
const folderLoc = 'client/dist/';
console.log('Static Folder:', path.join(__dirname, folderLoc));

// const appName = __dirname.split(path.sep).pop();
const appName = 'chronhibWebsite';
console.log('App Name:', appName);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression()); // Compress all routes
app.use(helmet()); // Protect against well known vulnerabilities
// Serve the static files from the Angular app
app.use(`/${appName}/`, express.static(path.join(__dirname, folderLoc)));
app.use(`/${appName}/assets/`, express.static(path.join(__dirname, folderLoc + 'assets/')));
app.use(cors()).use(bodyParser.json());
app.get(`/${appName}/api/`, (req, res) => {
  console.table(req.query);
  if (req.query.page && req.query.limit && req.query.fprop && req.query.fval && req.query.ctable && req.query.dtable) {
    console.log('Got into search parameters!');
    let page = req.query.page || ''; // pagination page number
    let limit = req.query.limit || ''; // pagination limit (how many rows per page)
    let fieldProperty = req.query.fprop || ''; // the property to filter by
    let fieldValue = req.query.fval; // the value of the property to filter by
    let currentTable = req.query.ctable; // the table we're currently on
    let destinationTable = req.query.dtable; // the table we're navigating to
    let startRow,
      endRow,
      between = ' ';
    // check that the page and limit query parameters are strings 🙄
    if (typeof page === 'string' && typeof limit === 'string') {
      if (parseInt(limit, 10) && parseInt(page, 10)) {
        startRow = (parseInt(page, 10) - 1) * parseInt(limit, 10); // gets the starting row of the query
        console.log('Start Row:', startRow);
        endRow = startRow + parseInt(limit, 10); // gets the ending row of the query
        console.log('End Row:', endRow);
        between = ` AND Sort_ID BETWEEN ${startRow} AND ${endRow}`;
        console.log('Between:', between);
        limit = '';
      } else {
        limit = limit === '0' ? '' : ' LIMIT ' + (parseInt(limit, 10) - 1); // if limit is 0 then there's no limit
      }
    }
    // check that the table query parameters are strings 🙄
    if (typeof currentTable === 'string' && typeof destinationTable === 'string') {
      const query = `SELECT * FROM ${destinationTable.toUpperCase()} WHERE ${fieldProperty} = '${fieldValue}'${between} ORDER BY Sort_ID ASC${limit}`;
      console.log(query);
      connection.query(query, (err, results) => {
        if (err) {
          console.log('Error: ', err);
          return res.send(err);
        } else {
          return res.json({
            data: results
          });
        }
      });
    }
  } else {
    console.log(
      'Go to:\n' +
        Object.keys(tables)
          .map(path => `/${appName}/api/${path} to see the ${path} table,`)
          .join('\n')
    );
    res.send(
      'Go to:<br/>' +
        Object.keys(tables)
          .map(path => `/${appName}/api/${path} to see the ${path} table,`)
          .join('<br/>')
    );
  }
});

// handles all the get api requests
app.get(`/${appName}/api/:path`, (req, res) => {
  console.log(req.params.path);
  const path = req.params.path;
  console.log(tables[path]);
  // if the first character is a question mark and therefore a query
  if (path in tables) {
    connection.query(tables[path], (err, results) => {
      if (err) {
        return res.send(err);
      } else {
        return res.json({
          data: results
        });
      }
    });
  } else {
    // Handles any requests that don't match the ones above
    // @ts-ignore
    return redirect(`/${appName}/*`); // redirect back to the homepage
  }
});

// redirect all the routes to the app and lets angular handle the routing
app.get(`/${appName}/*`, (req, res) => {
  res.sendFile(path.resolve(__dirname, folderLoc + 'index.html'));
});

const server = http.createServer(app);
if (node_env.toLowerCase() === 'production') {
  server.listen(() => console.log(`Chronhib server is running at http://chronhib.mucampus.net/${appName}/`));
} else {
  server.listen(port, () => console.log(`Chronhib server is running at ${host}:${port}/${appName}/`));
}
