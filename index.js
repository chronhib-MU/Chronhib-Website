import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import dotenv from 'dotenv';
const result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);
// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
const { NODE_ENV, PORT, USER, PASSWORD } = result.parsed;
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
  host: '127.0.0.1',
  user: USER,
  password: PASSWORD,
  database: 'test'
});

connection.connect(err => {
  if (err) {
    return err;
  }
});
// console.log(connection);
// Serve the static files from the Angular app
// app.use(express.static(join(__dirname, "client/build")));
app.use(cors());

// An api endpoint that returns a short list of items
// app.get("/api/getList", (req, res) => {
//   var list = ["item1", "item2", "item3"];
//   res.json(list);
//   console.log("Sent list of items");
// });
app.get('/', (req, res) => {
  res.send('go to ' + Object.keys(tables).map(path => ' /' + path + ' to see the ' + path + ' table'));
});

app.get('/:path', function (req, res) {
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

// Handles any requests that don't match the ones above
// app.get("*", (req, res) => {
//   res.sendFile(join(__dirname + "/client/build/index.html"));
// });
const port = PORT || 4000;
app.listen(port, () => {
  console.log('Chronhib server listening on port ' + port);
});
