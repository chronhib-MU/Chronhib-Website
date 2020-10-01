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
const log4js = require('log4js');
log4js.configure({
  appenders: { node: { type: 'file', filename: 'node.log' } },
  categories: { default: { appenders: ['node'], level: 'trace' } }
});

const logger = log4js.getLogger('node');
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
  logger.error(result.error);
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
logger.debug({ port, host, password, database, node_env, user, jwt_secret, jwt_expires_in, jwt_cookie_expires });
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
    logger.error('Error: ', err);
    return err;
  }
});
// console.log(connection);
// logger.debug(connection);
/* connection.query(tables['text'], (err, results) => {
  if (err) {
    console.log(err);
    logger.error('Error: ', err);
  } else {
    console.log('TEXT TABLE: ', {
      data: results
    });
    logger.debug('TEXT TABLE: ', {
      data: results
    });
  }
}); */
// TODO: Fix unencrypted passwords on the client
connection.query('SELECT `First_Name`,`Last_Name`,`Email`,`Password` FROM `USERS`', (err, results) => {
  if (err) {
    console.log(err);
    logger.error('Error: ', err);
  } else {
    console.table(results);
    logger.debug(results);
  }
});
const folderLoc = 'client/dist/';
// console.log('Static Folder:', path.join(__dirname, folderLoc));

// const appName = __dirname.split(path.sep).pop();
const appName = 'chronhibWebsite';
// console.log('App Name:', appName);
logger.info('App Name:', appName);
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
  logger.trace(req.body);
  const { firstName, lastName, email, password } = req.body;
  if (!email) {
    logger.error({
      message: 'Please provide an email to create an account.',
      title: 'No email provided!',
      type: 'error'
    });
    return res.json(
      JSON.stringify({
        message: 'Please provide an email to create an account.',
        title: 'No email provided!',
        type: 'error'
      })
    );
  } else if (!password) {
    logger.error({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
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
      logger.error(error);
      return error;
    }

    if (result && result.length > 0) {
      logger.error({
        message: 'Please try a different email.',
        title: 'Email already registered!',
        type: 'error'
      });
      return res.json(
        JSON.stringify({
          message: 'Please try a different email.',
          title: 'Email already registered!',
          type: 'error'
        })
      );
    } else {
      console.table(result);
      logger.debug(result);
    }

    // Encrypt password
    let hashedPassword = await bcrypt.hash(password, 10);
    // console.log(hashedPassword);
    logger.trace(hashedPassword);
    return connection.query(
      'INSERT INTO `USERS` SET ?',
      { First_Name: firstName, Last_Name: lastName, Email: email, Password: hashedPassword },
      // @ts-ignore
      (error, result) => {
        if (error) {
          // console.log(error);
          logger.error(error);
          return error;
        } else {
          // console.log(result);
          logger.debug(result);
          logger.info({
            message: 'Please login with your new account details.',
            title: 'Registration successful!',
            type: 'success'
          });
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
  logger.trace(req.body);
  const { email, password } = req.body;
  if (!email) {
    logger.error({
      message: 'Please provide an email to login.',
      title: 'No email provided!',
      type: 'error',
      error: req.body
    });
    return res.json(
      JSON.stringify({
        message: 'Please provide an email to login.',
        title: 'No email provided!',
        type: 'error',
        error: req.body
      })
    );
  } else if (!password) {
    logger.error({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
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
    logger.trace(result);
    if (!result || (result && result.length === 0)) {
      logger.error({
        message: 'Please check your email and try again.',
        title: 'Email not registered!',
        type: 'error'
      });
      return res.status(401).json(
        JSON.stringify({
          message: 'Please check your email and try again.',
          title: 'Email not registered!',
          type: 'error'
        })
      );
    } else if (!(await bcrypt.compareSync(password, result[0].Password))) {
      logger.error({
        message: 'Please double-check your password.',
        title: 'Incorrect password!',
        type: 'error'
      });
      return res.status(401).json(
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
      logger.info({
        message: 'You have been successfully logged in.',
        title: 'Login successful!',
        type: 'success',
        token
      });
      return res.status(200).json(
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
    logger.warn('401`- Unauthorized!');
    return res.status(401).json();
  } else {
    const decoded = jwt.verify(req.body.token, jwt_secret);
    // console.log(decoded);
    // @ts-ignore
    if (decoded.exp > 0) {
      // @ts-ignore
      connection.query('SELECT * FROM `USERS` WHERE `User_ID` = ?', [decoded.id], async (error, result) => {
        // console.log(result[0]);
        const { First_Name, Last_Name, Email } = result[0];
        logger.info({ First_Name, Last_Name, Email });
        return res.status(200).json(JSON.stringify({ First_Name, Last_Name, Email }));
      });
    } else {
      logger.warn('401`- Unauthorized!');
      return res.status(401).json();
    }
  }
});

app.post(`/${appName}/api/`, (req, res) => {
  //To access POST variable use req.body() methods.
  // console.log('Post Variable: ', req.body);
  logger.trace('Post Variable: ', req.body);
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
      logger.info('Post Query: ', updateQuery);
      // @ts-ignore
      connection.query(updateQuery, (err, results) => {
        if (err) {
          // console.log('Error: ', err);
          logger.error('Error: ', err);
          return res.send(err);
        } else {
          logger.info('Success: ', results);
          return res.status(200);
        }
        // console.log({ beforeTable, afterTable });
      });
    });
  } else if (command === 'createRow') {
    // if a row is created
    console.log(values);
    logger.trace(values);
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
          logger.error('Error: ', err);
          return res.send(err);
        } else {
          logger.info('Success: ', results);
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
  logger.trace(req.query);
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
    logger.trace('beforeQuery:', beforeQuery);
    logger.trace('afterQuery:', afterQuery);
    let beforeTable = [],
      afterTable = [];
    connection.query(afterQuery, (err, results) => {
      if (err) {
        // console.log('Error: ', err);
        logger.error('Error: ', err);
        return res.send(err);
      } else {
        afterTable = results;
      }
      if (beforeQuery !== '') {
        connection.query(beforeQuery, (err, results) => {
          if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', err);
            return res.send(err);
          } else {
            beforeTable = results;
          }
          // console.log({ beforeTable, afterTable });
          logger.info(results);
          return res.json({
            data: { beforeTable, afterTable }
          });
        });
      } else {
        logger.info(results);
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
  logger.trace(req.params.path);
  // if the first character is a question mark and therefore a query
  if (path in tables) {
    connection.query(tables[path], (err, results) => {
      if (err) {
        logger.error(err);
        return res.send(err);
      } else {
        // console.log(results);
        logger.info(results);
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
