// @ts-nocheck
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { promisify } = require('util');
const dotenv = require('dotenv');
const compression = require('compression');
const helmet = require('helmet');
const { parse } = require('path');
const log4js = require('log4js');
const serveStatic = require('serve-static');
const qs = require('qs');
const currentDate = new Date();
const formattedDate = `-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
log4js.configure({
  appenders: { node: { type: 'file', filename: `logs/node${formattedDate}.log` } },
  categories: { default: { appenders: ['node'], level: 'info' } }
});

const logger = log4js.getLogger('node');
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
const {
  NODE_ENV,
  PORT,
  HOST,
  USER,
  PASSWORD,
  DATABASE,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES,
  ENVTEST
} = result.parsed;

const port = process.env.PORT || PORT;
const host = process.env.HOST || HOST;
const password = process.env.PASSWORD || PASSWORD;
const database = process.env.DATABASE || DATABASE;
const node_env = process.env.NODE_ENV || NODE_ENV;
const user = process.env.USER || USER;
const jwt_secret = process.env.JWT_SECRET || JWT_SECRET;
const jwt_expires_in = process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN;
const envtest = process.env.ENVTEST || ENVTEST;
const jwt_cookie_expires = parseInt(process.env.JWT_COOKIE_EXPIRES || JWT_COOKIE_EXPIRES);
// console.table({ port, host, password, database, node_env, user, jwt_secret, jwt_expires_in, jwt_cookie_expires });

logger.info({
  port,
  host,
  password,
  database,
  node_env,
  user,
  jwt_secret,
  jwt_expires_in,
  jwt_cookie_expires,
  envtest
});
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
    console.log(err);
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
// connection.query('SELECT `First_Name`,`Last_Name`,`Email`,`Password` FROM `USERS`', (err, results) => {
//   if (err) {
//     console.log(err);
//     logger.error('Error: ', err);
//   } else {
//     console.table(results);
//     logger.debug(results);
//   }
// });
const folderLoc = 'client/dist/';
// console.log('Static Folder:', path.join(__dirname, folderLoc));

// const appName = __dirname.split(path.sep).pop();
const appName = 'chronhibWebsite';
// console.log('App Name:', appName);
logger.info('App Name:', appName);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000 }));
app.use(cookieParser());
app.use(compression()); // Compress all routes
app.use(helmet()); // Protect against well known vulnerabilities

// Serve the static files from the Angular app
app.use(`/${appName}/`, serveStatic(path.join(__dirname, folderLoc)));
app.use(`/${appName}/assets/`, serveStatic(path.join(__dirname, folderLoc + 'assets/')));
app.use(cors()).use(bodyParser.json());

app.post(`/${appName}/register`, (req, res, next) => {
  // Creates a new account
  // console.table(req.body);
  // logger.trace(req.body);
  const { firstName, lastName, email, password } = req.body;
  if (!email) {
    logger.error({
      message: 'Please provide an email to create an account.',
      title: 'No email provided!',
      type: 'error'
    });
    res.status(401).send({
      message: 'Please provide an email to create an account.',
      title: 'No email provided!',
      type: 'error'
    });
  } else if (!password) {
    logger.error({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
    res.status(401).send({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
  } else {
    connection.query('SELECT `Email` FROM `USERS` WHERE `Email` = ?', [email], async (error, result) => {
      if (error) {
        // console.log(error);
        logger.error(error);
        next(error);
      }
      console.log(result);
      if (result && result.length > 0) {
        logger.error({
          message: 'Please try a different email.',
          title: 'Email already registered!',
          type: 'error'
        });
        res.status(401).send({
          message: 'Please try a different email.',
          title: 'Email already registered!',
          type: 'error'
        });
      } else {
        // console.table(result);
        // logger.debug(result);

        // Encrypt password
        let hashedPassword = await bcrypt.hash(password, 10);
        // console.log(hashedPassword);
        // logger.trace(hashedPassword);
        connection.query(
          'INSERT INTO `USERS` SET ?',
          {
            First_Name: firstName,
            Last_Name: lastName,
            Email: email,
            Password: hashedPassword
          },
          (error, result) => {
            if (error) {
              // console.log(error);
              logger.error(error);
              next(error);
            } else {
              // console.log(result);
              // logger.debug(result);
              logger.info({
                message: 'Please login with your new account details.',
                title: 'Registration successful!',
                type: 'success'
              });
              res.status(200).send({
                message: 'Please login with your new account details.',
                title: 'Registration successful!',
                type: 'success'
              });
            }
          }
        );
      }
    });
  }
});

app.post(`/${appName}/login`, (req, res) => {
  // Signs user in
  console.table(req.body);
  const { email, password } = req.body;
  if (!email) {
    logger.error({
      message: 'Please provide an email to login.',
      title: 'No email provided!',
      type: 'error',
      error: req.body
    });
    res.status(401).send({
      message: 'Please provide an email to login.',
      title: 'No email provided!',
      type: 'error',
      error: req.body
    });
  } else if (!password) {
    logger.error({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
    res.status(401).send({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
  } else {
    connection.query('SELECT * FROM `USERS` WHERE `Email` = ?', [email], async (error, result) => {
      // console.log(result);
      // logger.trace(result);
      if (!result || (result && result.length === 0)) {
        logger.error({
          message: 'Please check your email and try again.',
          title: 'Email not registered!',
          type: 'error'
        });
        res.status(401).send({
          message: 'Please check your email and try again.',
          title: 'Email not registered!',
          type: 'error'
        });
      } else if (!(await bcrypt.compareSync(password, result[0].Password))) {
        logger.error({
          message: 'Please double-check your password.',
          title: 'Incorrect password!',
          type: 'error'
        });
        res.status(401).send({
          message: 'Please double-check your password.',
          title: 'Incorrect password!',
          type: 'error'
        });
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
        res.status(200).send({
          message: 'You have been successfully logged in.',
          title: 'Login successful!',
          type: 'success',
          token
        });
      }
    });
  }
});
app.post(`/${appName}/isLoggedIn`, (req, res) => {
  if (!req.body.token) {
    logger.warn('401`- Unauthorized!');
    res.status(401).send({
      message: 'You need to be logged in to access this page.',
      title: 'Access Denied!',
      type: 'error'
    });
  } else {
    const decoded = jwt.verify(req.body.token, jwt_secret);
    // console.log(decoded);
    if (decoded.exp > 0) {
      connection.query('SELECT * FROM `USERS` WHERE `User_ID` = ?', [decoded.id], async (error, result) => {
        // console.log(result[0]);
        const { First_Name, Last_Name, Email } = result[0];
        logger.info({ First_Name, Last_Name, Email });
        res.status(200).send({ First_Name, Last_Name, Email });
      });
    } else {
      logger.warn('401`- Unauthorized!');
      res.status(401).send({
        message: 'You need to be logged in to access this page.',
        title: 'Access Denied!',
        type: 'error'
      });
    }
  }
});

app.post(`/${appName}/api/`, (req, res, next) => {
  //To access POST variable use req.body() methods.
  console.log('Post Variable: ', req.body);
  logger.trace('Post Variable: ', req.body);
  if (req.body.command) {
    const { table, command, values } = req.body;
    // const values = JSON.parse(valuesString);
    if (command === 'moveRow') {
      // if the row is moved
      const updateQueries = [];
      values[0].forEach(rowData => {
        let query = 'UPDATE ?? SET `Sort_ID` = ? WHERE `ID` = ?;';
        updateQueries.push({ query, values: [table.toUpperCase(), rowData.Sort_ID, rowData.ID] });
      });
      updateQueries.forEach(updateQuery => {
        // console.log('Post Query: ', updateQuery);
        logger.trace('Post Query: ', updateQuery);
        connection.query(updateQuery.query, updateQuery.values, (err, results) => {
          if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', err);
            next(err);
          } else {
            // console.log('Success: ', results);
            logger.trace('Success: ', results);
            res.status(200).end();
          }
          // console.log({ beforeTable, afterTable });
        });
      });
    } else if (command === 'createRow') {
      // TODO: Create Rows
      // if a row is created
      console.log(values);
      // logger.trace(values);
    } else {
      // if the row needs to be updated
      values.forEach(value => {
        // console.log(value);
        let { id, fieldProperty, fieldValue } = value;
        console.table({ id, fieldProperty, fieldValue });
        let updateQuery = 'UPDATE ?? SET ?? = ? WHERE `ID` = ?;';
        // console.log('Post Query: ', updateQuery);
        // logger.trace('Post Query: ', updateQuery);
        connection.query(updateQuery, [table.toUpperCase(), fieldProperty, fieldValue, id], (err, results) => {
          if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', err);
            next(err);
          } else {
            logger.trace('Success: ', results);
            res.status(200).end();
          }
          // console.log({ beforeTable, afterTable });
        });
      });
    }
  } else {
    /**
     * Search Feature - Backend
     */

    // console.log('tableColumn', req.body);
    const { conditions, options, tableColumns } = req.body;

    // Select
    const selectedTableColumns = []; // ['`TEXT`.`Text_ID`', '`SENTENCES`.`Textual_Unit`']
    const selectStart = options.duplicateRows ? 'SELECT ' : 'SELECT DISTINCT ';
    tableColumns.forEach(obj => {
      Object.values(obj.column).forEach(column => selectedTableColumns.push(obj.table + '.' + column));
    });
    let selectedTables = tableColumns.map(tableColumn => tableColumn.table);

    // From
    if (!options.noConditions) selectedTables = selectedTables.concat(conditions.map(condition => condition.table));
    // Removes Duplicate Tables
    selectedTables = selectedTables.filter((table, index) => selectedTables.indexOf(table) === index);
    /** Now we know what tables need to be joined
     *  We need to add MORPHOLOGY to the list of tables to be joined -
     *  if there are more than 2 tables and 1 of them is LEMMATA,
     *  since it's the link to the other tables
     */
    const fromInnerJoins = [' FROM'];
    if (selectedTables.length > 1 && !options.noConditions) {
      fromInnerJoins.push(selectedTables[0]);
      if (selectedTables.includes('LEMMATA') && !selectedTables.includes('MORPHOLOGY')) {
        selectedTables.push('MORPHOLOGY');
      }
      const innerJoinConnections = {
        TEXT: {
          SENTENCES: `INNER JOIN SENTENCES ON TEXT.Text_ID = SENTENCES.Text_ID`,
          MORPHOLOGY: `INNER JOIN MORPHOLOGY ON TEXT.Text_ID = MORPHOLOGY.Text_ID`
        },
        SENTENCES: {
          TEXT: `INNER JOIN TEXT ON SENTENCES.Text_ID = TEXT.Text_ID`,
          MORPHOLOGY: `INNER JOIN MORPHOLOGY ON SENTENCES.Text_Unit_ID = MORPHOLOGY.Text_Unit_ID`
        },
        MORPHOLOGY: {
          TEXT: `INNER JOIN TEXT ON MORPHOLOGY.Text_ID = TEXT.Text_ID`,
          SENTENCES: `INNER JOIN SENTENCES ON MORPHOLOGY.Text_Unit_ID = SENTENCES.Text_Unit_ID`,
          LEMMATA: `INNER JOIN LEMMATA ON MORPHOLOGY.Lemma = LEMMATA.Lemma`
        },
        LEMMATA: {
          MORPHOLOGY: `INNER JOIN MORPHOLOGY ON LEMMATA.Lemma = MORPHOLOGY.Lemma`
        }
      };
      // This is to stop sql from complaining about non-unique tables/aliases
      let unique = {
        TEXT: true,
        SENTENCES: true,
        MORPHOLOGY: true,
        LEMMATA: true
      };
      if (selectedTables.length > 1) {
        for (let i = 0; i < selectedTables.length; i++) {
          const tableI = selectedTables[i];
          for (let j = 1; j < selectedTables.length; j++) {
            const tableJ = selectedTables[j];
            if (innerJoinConnections[tableI][tableJ]) {
              // If the inner join is not unique, use an alias
              if (!unique[tableJ]) {
                const innerJoinConnection = innerJoinConnections[tableI][tableJ].split(' ');
                // Alias is the first two letters of two tables being joined
                const alias = tableJ[0] + tableI[0];
                innerJoinConnection.splice(3, 0, alias); // Add the alias to the first table
                // Replace the table name to the alias,
                // by slicing the last element
                const aliasedCondition = innerJoinConnection.slice(-1).pop().split('.');
                // and set the first part to the alias
                aliasedCondition[0] = alias;
                // Replace the
                innerJoinConnection.splice(-1, 1, aliasedCondition.join('.'));
                fromInnerJoins.push(innerJoinConnection.join(' '));
              } else {
                fromInnerJoins.push(innerJoinConnections[tableI][tableJ]);
                unique[tableJ] = false;
              }
            }
          }
        }
      }
      // console.log('selectedTablesArr: ', selectedTablesArr);
      // console.log('fromInnerJoins: ', fromInnerJoins.join(' '));
    } else if (selectedTables.length > 1) {
      fromInnerJoins.push(selectedTables.join(', '));
    } else {
      fromInnerJoins.push(selectedTables[0]);
    }

    // Where
    const whereConditions = [' WHERE'];
    if (!options.noConditions) {
      conditions.forEach(condition => {
        if (condition.operator) {
          whereConditions.push(condition.operator);
        }
        const whereCondition = [];
        let comparator, comparatorVal;
        comparator = comparatorVal = '';
        switch (condition.comparator) {
          case 'contains':
            comparator = 'LIKE';
            comparatorVal = connection.escape('%' + condition.comparatorVal + '%');
            break;
          case 'starts with':
            comparator = 'LIKE';
            comparatorVal = connection.escape(condition.comparatorVal + '%');
            break;
          case 'ends with':
            comparator = 'LIKE';
            comparatorVal = connection.escape('%' + condition.comparatorVal);
            break;
          default:
            comparator = condition.comparator;
            comparatorVal = connection.escape(condition.comparatorVal);
            break;
        }

        whereCondition.push(condition.table + '.' + condition.column);
        whereCondition.push(comparator);
        whereCondition.push(comparatorVal);
        whereConditions.push(whereCondition.join(' '));
      });
      let openBracket = false;
      for (let index = 2; index < whereConditions.length; index += 2) {
        if (whereConditions[index] === 'AND' && openBracket === true) {
          whereConditions.splice(index, 0, ')'); // Add a closing bracket to the previous index in between the last condition and this and operator
          index++; // To compensate for the added element in the array
          openBracket = false;
        } else if (whereConditions[index] === 'OR' && openBracket === false) {
          whereConditions.splice(index - 1, 0, '('); // Add opening bracket before previous condition
          index++; // To compensate for the added element in the array
          openBracket = true;
        }
      }
      // We've finished going through the where conditions
      if (openBracket === true) {
        whereConditions.push(')'); // If there's still an openBracket then we add a closing bracket at the very last index
      }
    }
    const finalQuery =
      selectStart +
      selectedTableColumns.join(', ') +
      fromInnerJoins.join(' ') +
      (options.noConditions ? '' : whereConditions.join(' ')) +
      (parseInt(options.limit) ? ' LIMIT ' + options.limit : ' LIMIT 500000') +
      ';';
    console.log('Final Query: ', finalQuery);
    logger.info('Search Query: ', finalQuery);
    try {
      connection.query(finalQuery, (err, results) => {
        if (err) {
          // console.log('Error: ', err);
          logger.error(err);
          next(err);
        } else {
          res.status(200).send({
            data: { beforeTable: [], afterTable: results }
          });
        }
      });
    } catch (error) {
      logger.error(error);
    }
  }
});
// Handles all the advanced get api table queries
app.get(`/${appName}/api/`, (req, res, next) => {
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
    let page = req.query.page || '0', // pagination page number
      limit = req.query.limit || '0', // pagination limit (how many rows per page)
      fieldProperty = req.query.fprop || '', // the property to filter by
      fieldValue = req.query.fval || '', // the value of the property to filter by
      destinationTable = req.query.dtable || 'text', // the table we're navigating to
      currentTable = req.query.ctable || 'text'; // the table we're navigating from
    let startRow,
      endRow,
      between = ' ';
    let beforeQueryValues = [currentTable.toUpperCase(), fieldProperty, fieldValue];
    let afterQueryValues = [destinationTable.toUpperCase()];
    if (parseInt(limit, 10) && parseInt(page, 10)) {
      startRow = (parseInt(page, 10) - 1) * parseInt(limit, 10); // gets the starting row number of the query
      // console.log('Start Row:', startRow);
      endRow = startRow + parseInt(limit, 10); // gets the ending row number of the query
      // console.log('End Row:', endRow);
      between = ' AND `Sort_ID` BETWEEN ? AND ? ';
      afterQueryValues.push(startRow.toString(), endRow.toString());
      // console.log('Between:', between);
      limit = ' LIMIT 500000';
    } else {
      // if limit is 0 then there's no limit
      if (limit !== '0') {
        afterQueryValues.push((parseInt(limit, 10) - 1).toString());
        limit = ' LIMIT ?';
      } else {
        limit = ' LIMIT 500000';
      }
    }
    let beforeQuery = '',
      afterQuery = '';

    // Check if fieldProperty and fValue
    if (fieldProperty || fieldValue) {
      // beforeQuery
      if (currentTable !== destinationTable) {
        // if not the same table
        beforeQuery = 'SELECT * FROM ?? WHERE ?? = ?';
      }
      // afterQuery
      afterQuery = 'SELECT * FROM ?? WHERE ?? = ?' + between + 'ORDER BY ??, `Sort_ID` ASC' + limit;
      afterQueryValues.splice(1, 0, fieldProperty, fieldValue);
      if (limit !== ' LIMIT 500000') {
        afterQueryValues.splice(-2, 0, fieldProperty);
      } else {
        afterQueryValues.push(fieldProperty);
      }
    } else {
      afterQuery = 'SELECT * FROM ??' + between + 'ORDER BY `Sort_ID` ASC' + limit;
    }
    console.log('beforeQuery:', beforeQuery);
    console.log('afterQuery:', afterQuery);
    console.log('afterQueryValues:', afterQueryValues);
    logger.trace('beforeQuery:', beforeQuery);
    logger.info('afterQuery:', afterQuery);
    logger.info('afterQueryValues:', afterQueryValues);
    let beforeTable = [],
      afterTable = [];
    connection.query(afterQuery, afterQueryValues, (err, results) => {
      if (err) {
        // console.log('Error: ', err);
        logger.error('Error: ', err);
        next(err);
      } else {
        afterTable = results;
      }
      if (beforeQuery !== '') {
        connection.query(beforeQuery, beforeQueryValues, (err, results) => {
          if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', err);
            next(err);
          } else {
            beforeTable = results;
          }
          // console.log({ beforeTable, afterTable });
          // logger.info(results);
          res.status(200).send({
            data: { beforeTable, afterTable }
          });
        });
      } else {
        // logger.trace(results);
        res.status(200).send({
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
    console.log(req.query);
    res.send(
      'Go to:<br/>' +
        Object.keys(tables)
          .map(path => `/${appName}/api/${path} to see the ${path} table,`)
          .join('<br/>')
    );
  }
});

// handles all the basic get api table queries
app.get(`/${appName}/api/:path/headers`, (req, res, next) => {
  // console.log(req.params.path);
  const path = req.params.path;
  // console.log(tables[path]);
  logger.trace(req.params.path);
  const headerQuery = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = N?';
  connection.query(headerQuery, [DATABASE, path.split('/')[0].toUpperCase()], (err, results) => {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      // console.log(results);
      logger.trace(results);
      res.status(200).send({
        data: results.map(result => result.COLUMN_NAME)
      });
    }
  });
});
app.get(`/${appName}/api/:path`, (req, res, next) => {
  // console.log(req.params.path);
  const path = req.params.path;
  // console.log(tables[path]);
  // logger.trace(req.params.path);
  if (path in tables) {
    connection.query(tables[path], (err, results) => {
      if (err) {
        logger.error(err);
        next(err);
      } else {
        // console.log(results);
        // logger.info(results);
        res.status(200).send({
          data: { beforeTable: {}, afterTable: results }
        });
      }
    });
  } else {
    // Handles any requests that don't match the ones above
    redirect(`/${appName}/*`); // redirect back to the homepage
  }
});

// redirect all the routes to the app and lets angular handle the routing
app.get(`/${appName}/*`, (req, res) => {
  res.sendFile(path.resolve(__dirname, folderLoc + 'index.html'));
});

if (node_env.toLowerCase() === 'production') {
  server.listen(() => console.log(`Chronhib server is running at http://chronhib.mucampus.net/${appName}/`));
} else {
  server.listen(port, () => console.log(`Chronhib server is running at ${host}:${port}/${appName}/`));
}
