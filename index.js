import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql';
import dotenv from 'dotenv';
console.log(JSON.stringify(import.meta));

const moduleURL = new URL(import.meta.url);
console.log(`pathname ${moduleURL.pathname}`);
console.log(`dirname ${path.dirname(moduleURL.pathname)}`);

const __dirname = path.dirname(moduleURL.pathname);

console.log(__dirname);

const result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);
// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
const { NODE_ENV, PORT, HOST, USER, PASSWORD, DATABASE } = result.parsed;

const port = process.env.PORT || PORT;
const host = process.env.HOST || HOST;
const user = process.env.USER || USER;
const password = process.env.PASSWORD || PASSWORD;
const database = process.env.DATABASE || DATABASE;
const node_env = process.env.NODE_ENV || NODE_ENV;

const app = express();
// mysql table queries
const SELECT_ALL_TEXT_QUERY = 'SELECT * FROM text';
const SELECT_ALL_LEMMATA_QUERY = 'SELECT * FROM lemmata';
const SELECT_ALL_MORPHOLOGY_QUERY = 'SELECT * FROM morphology';
const SELECT_ALL_SENTENCES_QUERY = 'SELECT * FROM sentences';

const tables = {
  text: SELECT_ALL_TEXT_QUERY,
  lemmata: SELECT_ALL_LEMMATA_QUERY,
  morphology: SELECT_ALL_MORPHOLOGY_QUERY,
  sentences: SELECT_ALL_SENTENCES_QUERY
};
const connection = mysql.createConnection({
  host: HOST,
  user: USER,
  password: PASSWORD,
  database: DATABASE
});

connection.connect(err => {
  if (err) {
    return err;
  }
});
// console.log(connection);

// Serve the static files from the Angular app
// app.use(express.static(__dirname + '/client/dist'));
app.use(cors());
// Handles any requests that don't match the ones above
// app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

app.get('/', (req, res) => {
  res.send('go to ' + Object.keys(tables).map(path => ' /' + path + ' to see the ' + path + ' table'));
});

app.get('/:path', (req, res) => {
  // console.log(req.params.path);
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
    res.redirect('/');
  }
});

// const server = http.createServer(app);
// server.listen(port, () => console.log(`Chronhib server is running at http://${HOST}:${port}/`));
app.listen(port, () => {
  console.log('Chronhib server listening on port ' + port);
});
