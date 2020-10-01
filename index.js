const express = require('express');
// const serveStatic = require("serve-static");
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
// @ts-ignore
const { promisify } = require('util');
const dotenv = require('dotenv');
const compression = require('compression');
const helmet = require('helmet');
// @ts-ignore
const { parse } = require('path');
const moment = require('moment');
const fs = require('fs');
// let console = {};
console.log = obj => {
  let s = '';
  if (typeof obj === 'string') s = obj;
  else s = JSON.stringify(obj);
  const momentFormat = 'dddd, MMMM Do YYYY, h:mm:ss a';
  const dS = '[' + moment().format(momentFormat) + ']';
  s = `[${dS}]\n${s}\n`;
  fs.appendFile(`./logs/logs_${moment().format('DDMMYYYY')}.txt`, s, function (err) {
    if (err) throw err;
  });
};
// console.log(`pathname ${__filename}`);
// console.log(`dirname ${path.dirname(__filename)}`);

// console.log(__dirname);

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

// Make .env file that has all these variables in the form: KEY=VALUE, e.g. PORT=4000
const {
  NODE_ENV,
  PORT,
  HOST,
  USER,
  PASSWORD,
  DATABASE,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES
} = result.parsed;

const port = process.env.PORT || PORT;
const host = process.env.HOST || HOST;
const password = process.env.PASSWORD || PASSWORD;
const database = process.env.DATABASE || DATABASE;
const node_env = process.env.NODE_ENV || NODE_ENV;
const user = process.env.USER || USER;
const jwt_secret = process.env.JWT_SECRET || JWT_SECRET;
const jwt_expires_in = process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN;
// @ts-ignore
const jwt_cookie_expires = parseInt(process.env.JWT_COOKIE_EXPIRES || JWT_COOKIE_EXPIRES);
// console.table({ port, host, password, database, node_env, user, jwt_secret, jwt_expires_in, jwt_cookie_expires });
const app = express();
const server = http.createServer(app);
// mysql table queries
const SELECT_ALL_TEXT_QUERY = 'SELECT * FROM `TEXT` ORDER BY `Sort_ID` ASC LIMIT 100';
const SELECT_ALL_LEMMATA_QUERY = 'SELECT * FROM `LEMMATA` ORDER BY `ID` ASC LIMIT 100';
const SELECT_ALL_MORPHOLOGY_QUERY = 'SELECT * FROM `MORPHOLOGY` ORDER BY `Text_Unit_ID`, `Sort_ID` ASC LIMIT 100';
const SELECT_ALL_SENTENCES_QUERY = 'SELECT * FROM `SENTENCES` ORDER BY `Sort_ID` ASC LIMIT 100';

const tables = {
  text: SELECT_ALL_TEXT_QUERY,
  lemmata: SELECT_ALL_LEMMATA_QUERY,
  morphology: SELECT_ALL_MORPHOLOGY_QUERY,
  sentences: SELECT_ALL_SENTENCES_QUERY
};
const dbconfig = {
  host,
  user,
  password,
  database
};
const connection = mysql.createConnection(dbconfig);

connection.connect(err => {
  if (err) {
    return err;
  }
});
// console.log(connection);
/* connection.query(tables['text'], (err, results) => {
  if (err) {
    console.log(err);
  } else {
    console.log('TEXT TABLE: ', {
      data: results
    });
  }
}); */
// TODO: Fix unencrypted passwords on the client
connection.query('SELECT `First_Name`,`Last_Name`,`Email`,`Password` FROM `USERS`', (err, results) => {
  if (err) {
    console.log(err);
  } else {
    console.table(results);
  }
});
const folderLoc = 'client/dist/';
// console.log('Static Folder:', path.join(__dirname, folderLoc));

// const appName = __dirname.split(path.sep).pop();
const appName = 'chronhibWebsite';
// console.log('App Name:', appName);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression()); // Compress all routes
app.use(helmet()); // Protect against well known vulnerabilities
// Serve the static files from the Angular app
app.use(`/${appName}/`, express.static(path.join(__dirname, folderLoc)));
app.use(`/${appName}/assets/`, express.static(path.join(__dirname, folderLoc + 'assets/')));
app.use(cors()).use(bodyParser.json());

app.post(`/${appName}/register`, (req, res) => {
  // Creates a new account
  console.table(req.body);
  const { firstName, lastName, email, password } = req.body;
  if (!email) {
    return res.json(
      JSON.stringify({
        message: 'Please provide an email to create an account.',
        title: 'No email provided!',
        type: 'error'
      })
    );
  } else if (!password) {
    return res.json(
      JSON.stringify({
        message: 'Please provide a password.',
        title: 'No password provided!',
        type: 'error'
      })
    );
  }
  connection.query('SELECT `Email` FROM `USERS` WHERE `Email` = ?', [email], async (error, result) => {
    if (error) {
      // console.log(error);
      // console.log(result);
      return error;
    }

    if (result && result.length > 0) {
      return res.json(
        JSON.stringify({
          message: 'Please try a different email.',
          title: 'Email already registered!',
          type: 'error'
        })
      );
    } else {
      console.table(result);
      console.table(error);
    }

    // Encrypt password
    let hashedPassword = await bcrypt.hash(password, 10);
    // console.log(hashedPassword);
    return connection.query(
      'INSERT INTO `USERS` SET ?',
      { First_Name: firstName, Last_Name: lastName, Email: email, Password: hashedPassword },
      // @ts-ignore
      (error, result) => {
        if (error) {
          // console.log(error);
          return error;
        } else {
          // console.log(result);
          return res.json(
            JSON.stringify({
              message: 'Please login with your new account details.',
              title: 'Registration successful!',
              type: 'success'
            })
          );
        }
      }
    );
  });
});

app.post(`/${appName}/login`, (req, res) => {
  // Signs user in
  console.table(req.body);
  const { email, password } = req.body;
  if (!email) {
    return res.json(
      JSON.stringify({
        message: 'Please provide an email to login.',
        title: 'No email provided!',
        type: 'error',
        error: req.body
      })
    );
  } else if (!password) {
    return res.json(
      JSON.stringify({
        message: 'Please provide a password.',
        title: 'No password provided!',
        type: 'error'
      })
    );
  }
  // @ts-ignore
  connection.query('SELECT * FROM `USERS` WHERE `Email` = ?', [email], async (error, result) => {
    console.log(result);
    if (!result || (result && result.length === 0)) {
      return res.status(401).json(
        JSON.stringify({
          message: 'Please check your email and try again.',
          title: 'Email not registered!',
          type: 'error'
        })
      );
    } else if (!(await bcrypt.compareSync(password, result[0].Password))) {
      res.status(401).json(
        JSON.stringify({
          message: 'Please double-check your password.',
          title: 'Incorrect password!',
          type: 'error'
        })
      );
    } else {
      const id = result[0].User_ID;
      const token = jwt.sign({ id }, jwt_secret, {
        expiresIn: jwt_expires_in
      });
      // console.log('The token is: ' + token);
      res.status(200).json(
        JSON.stringify({
          message: 'You have been successfully logged in.',
          title: 'Login successful!',
          type: 'success',
          token
        })
      );
    }
  });
});
app.post(`/${appName}/isLoggedIn`, (req, res) => {
  if (!req.body.token) {
    res.status(401).json();
  } else {
    const decoded = jwt.verify(req.body.token, jwt_secret);
    // console.log(decoded);
    // @ts-ignore
    if (decoded.exp > 0) {
      // @ts-ignore
      connection.query('SELECT * FROM `USERS` WHERE `User_ID` = ?', [decoded.id], async (error, result) => {
        // console.log(result[0]);
        const { First_Name, Last_Name, Email } = result[0];
        res.status(200).json(JSON.stringify({ First_Name, Last_Name, Email }));
      });
    } else {
      res.status(401).json();
    }
  }
});

app.post(`/${appName}/api/`, (req, res) => {
  //To access POST variable use req.body() methods.
  console.log('Post Variable: ', req.body);
  const { table, command, values } = req.body;
  if (command === 'moveRow') {
    // if the row is moved
    const updateQueries = [];
    values[0].forEach(rowData => {
      let query =
        'UPDATE `' + table.toUpperCase() + '` SET `Sort_ID` = ' + rowData.Sort_ID + ' WHERE `ID` = ' + rowData.ID + ';';
      updateQueries.push(query);
    });
    updateQueries.forEach(updateQuery => {
      // console.log('Post Query: ', updateQuery);
      // @ts-ignore
      connection.query(updateQuery, (err, results) => {
        if (err) {
          // console.log('Error: ', err);
          return res.send(err);
        } else {
          return res.status(200);
        }
        // console.log({ beforeTable, afterTable });
      });
    });
  } else if (command === 'createRow') {
    // if a row is created
    console.log(values);
  } else {
    // if the row needs to be updated
    values.forEach(value => {
      // console.log(value);
      let { id, fieldProperty, fieldValue } = value;
      console.table({ id, fieldProperty, fieldValue });
      let updateQuery =
        'UPDATE `' +
        table.toUpperCase() +
        '` SET `' +
        fieldProperty +
        '` = "' +
        fieldValue +
        '" WHERE `ID` = ' +
        id +
        ';';
      // console.log('Post Query: ', updateQuery);
      // @ts-ignore
      connection.query(updateQuery, (err, results) => {
        if (err) {
          // console.log('Error: ', err);
          return res.send(err);
        } else {
          return res.status(200);
        }
        // console.log({ beforeTable, afterTable });
      });
    });
  }
});
// Handles all the advanced get api table queries
app.get(`/${appName}/api/`, (req, res) => {
  console.table(req.query);
  if (
    typeof req.query.page === 'string' &&
    typeof req.query.limit === 'string' &&
    typeof req.query.fprop === 'string' &&
    typeof req.query.fval === 'string' &&
    typeof req.query.dtable === 'string' &&
    typeof req.query.ctable === 'string'
  ) {
    // console.log('Got into search parameters!');
    let page = req.query.page || '0'; // pagination page number
    let limit = req.query.limit || '0'; // pagination limit (how many rows per page)
    let fieldProperty = req.query.fprop || ''; // the property to filter by
    let fieldValue = req.query.fval || ''; // the value of the property to filter by
    let destinationTable = req.query.dtable || 'text'; // the table we're navigating to
    let currentTable = req.query.ctable || 'text'; // the table we're navigating from
    let startRow,
      endRow,
      between = ' ';
    if (parseInt(limit, 10) && parseInt(page, 10)) {
      startRow = (parseInt(page, 10) - 1) * parseInt(limit, 10); // gets the starting row of the query
      // console.log('Start Row:', startRow);
      endRow = startRow + parseInt(limit, 10); // gets the ending row of the query
      // console.log('End Row:', endRow);
      between = ' AND `Sort_ID` BETWEEN ' + startRow + ' AND ' + endRow + ' ';
      // console.log('Between:', between);
      limit = '';
    } else {
      limit = limit === '0' ? '' : ' LIMIT ' + (parseInt(limit, 10) - 1); // if limit is 0 then there's no limit
    }
    let beforeQuery = '',
      afterQuery = '';

    // Check if fieldProperty and fValue
    if (fieldProperty || fieldValue) {
      // beforeQuery
      if (currentTable !== destinationTable) {
        // if not the same table
        beforeQuery =
          'SELECT * FROM `' + currentTable.toUpperCase() + '` WHERE `' + fieldProperty + '` = "' + fieldValue + '"';
      }
      // afterQuery
      afterQuery =
        'SELECT * FROM `' +
        destinationTable.toUpperCase() +
        '` WHERE `' +
        fieldProperty +
        '` = "' +
        fieldValue +
        '"' +
        between +
        'ORDER BY ' +
        fieldProperty +
        ', `Sort_ID` ASC' +
        limit;
    } else {
      afterQuery =
        'SELECT * FROM `' + destinationTable.toUpperCase() + '`' + between + 'ORDER BY `Sort_ID` ASC' + limit;
    }
    // console.log('beforeQuery:', beforeQuery);
    // console.log('afterQuery:', afterQuery);
    let beforeTable = [],
      afterTable = [];
    connection.query(afterQuery, (err, results) => {
      if (err) {
        // console.log('Error: ', err);
        return res.send(err);
      } else {
        afterTable = results;
      }
      if (beforeQuery !== '') {
        connection.query(beforeQuery, (err, results) => {
          if (err) {
            // console.log('Error: ', err);
            return res.send(err);
          } else {
            beforeTable = results;
          }
          // console.log({ beforeTable, afterTable });
          return res.json({
            data: { beforeTable, afterTable }
          });
        });
      } else {
        return res.json({
          data: { beforeTable, afterTable }
        });
      }
    });
  } else {
    /*console.log(
      'Go to:\n' +
        Object.keys(tables)
          .map(path => `/${appName}/api/${path} to see the ${path} table,`)
          .join('\n')
    );*/
    res.send(
      'Go to:<br/>' +
        Object.keys(tables)
          .map(path => `/${appName}/api/${path} to see the ${path} table,`)
          .join('<br/>')
    );
  }
});

// handles all the basic get api table queries
app.get(`/${appName}/api/:path`, (req, res) => {
  // console.log(req.params.path);
  const path = req.params.path;
  // console.log(tables[path]);
  // if the first character is a question mark and therefore a query
  if (path in tables) {
    connection.query(tables[path], (err, results) => {
      if (err) {
        return res.send(err);
      } else {
        // console.log(results);
        return res.json({
          data: { beforeTable: {}, afterTable: results }
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
// @ts-ignore
app.get(`/${appName}/*`, (req, res) => {
  res.sendFile(path.resolve(__dirname, folderLoc + 'index.html'));
});

if (node_env.toLowerCase() === 'production') {
  server.listen(() => console.log(`Chronhib server is running at http://chronhib.mucampus.net/${appName}/`));
} else {
  server.listen(port, () => console.log(`Chronhib server is running at ${host}:${port}/${appName}/`));
}
