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
const SELECT_ALL_TEXT_QUERY = 'SELECT * FROM text LIMIT 100';
const SELECT_ALL_LEMMATA_QUERY = 'SELECT * FROM lemmata LIMIT 100';
const SELECT_ALL_MORPHOLOGY_QUERY = 'SELECT * FROM morphology LIMIT 100';
const SELECT_ALL_SENTENCES_QUERY = 'SELECT * FROM sentences LIMIT 100';

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
app.use(compression()); // Compress all routes
app.use(helmet()); // Protect against well known vulnerabilities
// Serve the static files from the Angular app
app.use(`/${appName}/`, express.static(path.join(__dirname, folderLoc)));
app.use(`/${appName}/assets/`, express.static(path.join(__dirname, folderLoc + 'assets/')));
app.use(cors()).use(bodyParser.json());
app.get(`/${appName}/api/`, (req, res) => {
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
});
app.get(`/${appName}/api/:path`, (req, res) => {
  console.log(req.params.path);
  const path = req.params.path;
  console.log(tables[path]);
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
    return redirect(`/${appName}/*`);
  }
});
app.get(`/${appName}/*`, (req, res) => {
  console.log();
  res.sendFile(path.resolve(__dirname, folderLoc + 'index.html'));
});

const server = http.createServer(app);
server.listen(port, () => console.log(`Chronhib server is running at ${host}/`));
