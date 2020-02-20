import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
// import { join } from 'path';
import dotenv from 'dotenv';
// dotenv.config();K
console.log(dotenv);
const result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);

const app = express();
// mysql table queries
const SELECT_ALL_TEXT_QUERY = 'SELECT * FROM text';
const SELECT_ALL_LEMMATA_QUERY = 'SELECT * FROM lemmata';
const SELECT_ALL_MORPHOLOGY_QUERY = 'SELECT * FROM morphology';
const SELECT_ALL_SENTENCES_QUERY = 'SELECT * FROM sentences';

const tables = [
  { query: SELECT_ALL_TEXT_QUERY, route: 'text' },
  { query: SELECT_ALL_LEMMATA_QUERY, path: 'lemmata' },
  { query: SELECT_ALL_MORPHOLOGY_QUERY, path: 'morphology' },
  { query: SELECT_ALL_SENTENCES_QUERY, path: 'sentences' }
];
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Ch31$3a3',
  database: 'test'
});

connection.connect(err => {
  if (err) {
    return err;
  }
});
// console.log(connection);
// Serve the static files from the React app
// app.use(express.static(join(__dirname, "client/build")));
app.use(cors());

// An api endpoint that returns a short list of items
// app.get("/api/getList", (req, res) => {
//   var list = ["item1", "item2", "item3"];
//   res.json(list);
//   console.log("Sent list of items");
// });
app.get('/', (req, res) => {
  res.send('go to /' + tables.toString() + 'to see texts');
});

for (const table of tables) {
  app.get('/' + table.path, (req, res) => {
    connection.query(table.query, (err, results) => {
      if (err) {
        return res.send(err);
      } else {
        return res.json({
          data: results
        });
      }
    });
  });
}
app.get('/texts', (req, res) => {
  connection.query(SELECT_ALL_TEXT_QUERY, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      return res.json({
        data: results
      });
    }
  });
});
// Handles any requests that don't match the ones above
// app.get("*", (req, res) => {
//   res.sendFile(join(__dirname + "/client/build/index.html"));
// });
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Texts server listening on port ' + port);
});
// console.log("App is listening on port " + port);
