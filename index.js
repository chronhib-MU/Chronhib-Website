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
const { query } = require('express');
const { throws } = require('assert');
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

// logger.info({
//   port,
//   host,
//   password,
//   database,
//   node_env,
//   user,
//   jwt_secret,
//   jwt_expires_in,
//   jwt_cookie_expires,
//   envtest
// });
const app = express();
const server = http.createServer(app);
// mysql table queries
const SELECT_ALL_TEXT_QUERY = 'SELECT * FROM `TEXT` ORDER BY `Sort_ID` ASC LIMIT 100';
const SELECT_ALL_SENTENCES_QUERY =
  'SELECT * FROM `SENTENCES` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID` ASC LIMIT 100';
const SELECT_ALL_MORPHOLOGY_QUERY =
  'SELECT * FROM `MORPHOLOGY` ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID`, `ID` ASC LIMIT 100';
const SELECT_ALL_LEMMATA_QUERY =
  'SELECT * FROM `LEMMATA` ORDER BY `Lemma` COLLATE utf8mb4_unicode_ci , `Sort_ID` ASC LIMIT 100';

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
      // console.log(result);
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
    let { table, command, values, user } = req.body;
    table = table.toUpperCase();
    console.log({ table, command, values, user });
    if (command === 'moveRow') {
      // if the row is moved
      const updateQueries = [];
      values[0].forEach(rowData => {
        let query = 'UPDATE ?? SET `Sort_ID` = ? WHERE `ID` = ?;';
        updateQueries.push({ query, values: [table, rowData.Sort_ID, rowData.ID] });
      });
      updateQueries.forEach(updateQuery => {
        // console.log('Post Query: ', updateQuery);
        logger.info('Post Query: ', updateQuery);
        connection.query(updateQuery.query, updateQuery.values, (err, results) => {
          if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', { Error: err, User: user });
            next(err);
          } else {
            // console.log('Success: ', results);
            logger.trace('Success: ', { Results: results, User: user });
            res.status(200).end();
          }
          // console.log({ beforeTable, afterTable });
        });
      });
    } else if (command === 'createRow') {
      // TODO: Create Rows
      // if a row is created
      console.log('Row Values: ', values);
      console.log('Row Table: ', table);
      // logger.trace(values);
      const tableStructures = {
        TEXT: {

          'ID': null,
          'Text_ID': '',
          'Title': '',
          'Date': '',
          'Dating_Criteria': '',
          'Edition': '',
          'MSS': '',
          'Digital_MSS': '',
          'Thes': '',
          'Contributor': '',
          'Created_Date': '',
          'MS_Checked': '',
          'Reason_Of_MS_Choice_And_Editorial_Policy': '',
          'Sort_ID': null
        },
        SENTENCES: {
          'ID': null,
          'Text_ID': '',
          'Text_Unit_ID': '',
          'Locus1': '',
          'Locus2': '',
          'Locus3': '',
          'Textual_Unit': '',
          'Translation': '',
          'Textual_Notes': '',
          'Translation_Notes': '',
          'Latin_Text': '',
          'Translation_From_Latin': '',
          'Variant_Readings': '',
          'Subunit': '',
          'Sort_ID': null
        },
        MORPHOLOGY: {
          'ID': null,
          'Text_Unit_ID': '',
          'Stressed_Unit': '',
          'Morph': '',
          'Expected_Morph': '',
          'Lemma': '',
          'Secondary_Meaning': '',
          'Analysis': '',
          'Comments': '',
          'Augm': '',
          'Rel': '',
          'Trans': '',
          'Depend': '',
          'Depon': '',
          'Contr': '',
          'Hiat': '',
          'Mut': '',
          'Causing_Mut': '',
          'Hybrid_form': '',
          'Problematic_Form': '',
          'Onomastic_Complex': '',
          'Onomastic_Usage': '',
          'SpecialCharacter': '',
          'Syntactic_ID': '',
          'Phrase_structure_tree': '',
          'Syntactic_Unit': '',
          'Phrase_type': '',
          'Phrase': '',
          'Syntactic_Unit_Translation': '',
          'id_of_change': '',
          'Var_Status_1': '',
          'Var_Status_2': '',
          'Var_Status_3': '',
          'Var_Status_4': '',
          'Var_Status_5': '',
          'Text_ID': '',
          'Sort_ID': null
        },
        LEMMATA: {
          'ID': null,
          'Lemma': '',
          'Meaning': '',
          'DIL_Headword': '',
          'Part_Of_Speech': '',
          'Class': '',
          'Gender': '',
          'Etymology': '',
          'Comments': '',
          'Lang': '',
          'Sort_ID': null
        }
      };
      console.log([table, Object.keys(tableStructures[table]), Object.values(tableStructures[table])]);
      let query = connection.query('INSERT INTO ?? (??) VALUES (?);', [table, Object.keys(tableStructures[table]), Object.values(tableStructures[table])], (error, result) => {
        if (error) {
          // console.log(error);
          logger.error('Error: ', { Error: error, User: user });
          next(error);
        } else {
          const id = parseInt(result.insertId.toString());
          logger.trace('Success: ', { Results: result, User: user });
          const tableSortID = table + '.Sort_ID';
          const tableID = table + '.ID';
          let createRowQuery = '';
          let createRowValues = [];
          if (values.length) {
            const tableFProp = table + '.' + values[0].fprop;
            createRowQuery =
              ['UPDATE ?? SET ?? = ? WHERE ?? = ?;', 'UPDATE ?? SET ?? = ? WHERE ?? = ?;'];
            createRowValues = [[table, tableSortID, id, tableID, id]];
            createRowValues.push([table, tableFProp, values[0].fval, tableID, id]);
          } else {
            createRowQuery = ['UPDATE ?? SET ?? = ? WHERE ?? = ?;'];
            createRowValues = [[table, tableSortID, id, tableID, id]];
          }
          console.log('Create Row Query: ', createRowQuery);
          console.log('Create Row Values: ', createRowValues);
          console.log('Connection Query 0: ', query.sql)
          query = connection.query(createRowQuery[0], createRowValues[0], (err, result) => {
            if (err) {
              console.log('Error: ', { Error: err, User: user });
              logger.error('Error: ', { Error: err, User: user });
              next(err);
            } else {
              console.log(result);
              console.log('Connection Query 1: ', query.sql);
              console.log('createRowQuery Length: ', createRowQuery, createRowQuery.length);
              if (createRowQuery.length > 1) {
                query = connection.query(createRowQuery[1], createRowValues[1], (err, result) => {
                  if (err) {
                    console.log('Error: ', { Error: err, User: user });
                    logger.error('Error: ', { Error: err, User: user });
                    next(err);
                  } else {
                    console.log(result);
                    console.log('Connection Query 2: ', query.sql);
                    res.status(200).end();
                  }
                });
              } else {
                res.status(200).end();
              }
            }
          });
        }
      });
    } else if (command === 'removeRow') {
      console.log(values);
      const query = 'DELETE FROM ?? WHERE `ID` IN (?);'
      connection.query(query, [table, values], (err, result) => {
        if (err) {
          // console.log('Error: ', err);
          logger.error('Error: ', err);
          next(err);
        } else {
          console.log(result);
          res.status(200).end();
        }
      })
    } else {
      // if the row needs to be updated
      values.forEach(value => {
        // console.log(value);
        let { id, fieldProperty, fieldValue } = value;
        fieldValue = fieldValue === null ? '' : fieldValue;
        console.table({ id, fieldProperty, fieldValue });
        let updateQuery = 'UPDATE ?? SET ?? = ? WHERE `ID` = ?;';
        // console.log('Post Query: ', updateQuery);
        logger.info('Post Query: ', [updateQuery, ...[table, fieldProperty, fieldValue, id]]);
        connection.query(updateQuery, [table, fieldProperty, fieldValue, id], (err, results) => {
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
    connection.query(
      'INSERT INTO `SEARCH` SET ?',
      { Query: req.body.query, Creator: req.body.creator },
      (error, result) => {
        if (error) {
          // console.log(error);
          logger.error(error);
          next(error);
        } else {
          res.status(200).end(result.insertId.toString());
        }
      }
    );
  }
});
// Handles all the advanced get api table queries
app.get(`/${appName}/api/`, (req, res, next) => {
  console.table(req.query);
  logger.trace(req.query);
  const search = req.query.search === 'true' ? true : false;
  if (search) {
    /**
     * Search Feature - Backend
     */
    // First we get the searchQuery from the DB using the ID
    let searchQuery = {};
    try {
      if (!req.query.id) {
        res.status(404).send({
          message: req.query.id ? 'Search ID ' + req.query.id + ' does not exist.' : 'Search ID needed to show search results.',
          title: req.query.id ? 'Invalid Search ID!' : 'No Search ID found!',
          type: 'error'
        });
      }
      connection.query('SELECT `Query` FROM `SEARCH` WHERE `ID`= ?', req.query.id, (error, results) => {
        if (error) {
          // console.log(error);
          logger.error(error);
          next(error);
        } else if (results[0] && JSON.parse(results[0]?.Query)) {
          searchQuery = JSON.parse(results[0].Query);

          // console.log('tableColumn', req.body);
          const { conditions, options, tableColumns } = searchQuery;
          console.log('Search Query: ', searchQuery)
          // Select
          const selectedTableColumns = []; // ['`TEXT`.`Text_ID`', '`SENTENCES`.`Textual_Unit`']
          const selectStart = options?.duplicateRows ? 'SELECT ' : 'SELECT DISTINCT ';
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
          if (selectedTables.length > 1) {
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
                    // Make sure the inner join is unique
                    if (unique[tableJ]) {
                      fromInnerJoins.push(innerJoinConnections[tableI][tableJ]);
                      unique[tableJ] = false;
                    }
                  }
                }
              }
            }
            // console.log('selectedTablesArr: ', selectedTablesArr);
            // console.log('fromInnerJoins: ', fromInnerJoins.join(' '));
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
              if (condition.negated) {
                whereConditions.push('NOT');
              }
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
                case 'within':
                  comparator = 'IN';
                  comparatorVal =
                    '(' +
                    condition.comparatorVal
                      .split(',')
                      .map(values => connection.escape(values))
                      .toString() +
                    ')';
                  break;
                default:
                  comparator = condition.comparator;
                  comparatorVal = connection.escape(condition.comparatorVal);
                  break;
              }
              let conditionTableColumn = condition.table + '.' + condition.column;
              let conditionComparator = comparator;
              let conditionComparatorVal = comparatorVal;
              const excludeCollation = ['ID', 'Sort_ID', 'Timestamp', 'Text_Unit_ID', 'Text_ID'];
              // Accent and Case Sensitivity should not affect the above columns
              // Also, there's no way to make accent sensitive queries also case sensitive
              if (!excludeCollation.includes(condition.column)) {
                if (comparator === 'IN') {
                  if (!condition.accentSensitive) {
                    conditionTableColumn = conditionTableColumn + ' COLLATE utf8mb4_general_ci';
                    conditionComparatorVal = conditionComparatorVal + ' COLLATE utf8_general_ci';
                  } else if (!condition.caseSensitive) {
                    conditionTableColumn = 'LOWER(' + conditionTableColumn + ')';
                    conditionComparatorVal = 'LOWER(' + conditionComparatorVal + ')';
                  }
                } else {
                  if (!condition.accentSensitive) {
                    conditionTableColumn = conditionTableColumn + ' COLLATE utf8mb4_general_ci';
                    conditionComparatorVal = conditionComparatorVal + ' COLLATE utf8_general_ci';
                  } else if (!condition.caseSensitive) {
                    conditionTableColumn = 'LOWER(' + conditionTableColumn + ')';
                    conditionComparatorVal = 'LOWER(' + conditionComparatorVal + ')';
                  }
                }
              }
              whereConditions.push(conditionTableColumn, conditionComparator, conditionComparatorVal);
            });
            logger.info('Where pre brackets: ', JSON.stringify(whereConditions))
            if (whereConditions.includes('AND')) {
              let openBracket = false;
              for (let index = 2; index < whereConditions.length; index += 2) {
                if (whereConditions[index] === 'AND' && openBracket === true) {
                  whereConditions.splice(index, 0, ')'); // Add a closing bracket to the previous index in between the last condition and this and operator
                  index++; // To compensate for the added element in the array
                  openBracket = false;
                } else if (whereConditions[index] === 'OR' && openBracket === false) {
                  whereConditions.splice(index - 3, 0, '('); // Add opening bracket before previous condition
                  index++; // To compensate for the added element in the array
                  openBracket = true;
                }
              }
              // We've finished going through the where conditions
              if (openBracket === true) {
                whereConditions.push(')'); // If there's still an openBracket then we add a closing bracket at the very last index
              }
            }
          }
          const limit =
            parseInt(options.limit) > 0
              ? parseInt(options.limit)
              : parseInt(req.query.limit) > 0
                ? parseInt(req.query.limit)
                : 100;
          const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 0;
          console.log(limit, page);
          let finalQuery =
            selectStart +
            selectedTableColumns.join(', ') +
            fromInnerJoins.join(' ') +
            (options.noConditions ? '' : whereConditions.join(' ')) +
            ' LIMIT ' +
            limit;
          logger.info('Search Query: ', finalQuery);
          let countQuery = 'SELECT COUNT(';
          if (!options.duplicateRows) {
            countQuery += 'DISTINCT ';
          }
          countQuery +=
            selectedTableColumns[0] +
            ') as numRows ' +
            fromInnerJoins.join(' ') +
            (options.noConditions ? '' : whereConditions.join(' '));
          try {
            console.log('Count Query: ', countQuery);
            connection.query(countQuery, (error, result) => {
              if (error) {
                console.log('Error: ', error);
                logger.info({ id: req.query.id, searchQuery });
                logger.error(error);
                next(err);
              }
              else if (result) {
                const numRows = result[0].numRows;
                console.log('Offset: ', page * limit);

                finalQuery += ' OFFSET ' + page * limit + ';';
                console.log('Final Query: ', finalQuery);
                connection.query(finalQuery, (err, results) => {
                  if (err) {
                    console.log('Error: ', err);
                    logger.info({ id: req.query.id, searchQuery });
                    logger.error(err);
                    next(err);
                  } else {
                    res.status(200).send({
                      data: { beforeTable: searchQuery, afterTable: results, numRows }
                    });
                  }
                });
              } else {
                res.status(400).send({
                  message: req.query.id ? 'Search ID ' + req.query.id + ' does not exist.' : 'Search ID needed to show search results.',
                  title: req.query.id ? 'Invalid Search ID!' : 'No Search ID found!',
                  type: 'error'
                });
              }
            });
          } catch (error) {
            console.log('Error: ', error);
            logger.info({ id: req.query.id, searchQuery });
            logger.error(error);
          }
        } else {
          logger.error('Error: Search ID does not exist - ', req.query.id);
          res.status(404).send({
            message: req.query.id ? 'Search ID ' + req.query.id + ' does not exist.' : 'Search ID needed to show query.',
            title: req.query.id ? 'Invalid Search ID!' : 'No Search ID found!',
            type: 'error'
          });
        }
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  } else if (
    typeof req.query.page === 'string' &&
    typeof req.query.limit === 'string' &&
    typeof req.query.fprop === 'string' &&
    typeof req.query.fval === 'string' &&
    typeof req.query.dtable === 'string' &&
    typeof req.query.ctable === 'string'
  ) {
    let page = (parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 0) || 0, // pagination page number
      limit = (parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 100) || 100, // pagination limit (how many rows per page)
      fieldProperty = req.query.fprop || '', // the property to filter by
      fieldValue = req.query.fval || '', // the value of the property to filter by
      destinationTable = req.query.dtable || 'text', // the table we're navigating to
      currentTable = req.query.ctable || 'text', // the table we're navigating from
      beforeQueryValues = [currentTable.toUpperCase(), fieldProperty, fieldValue],
      afterQueryValues = [destinationTable.toUpperCase()],
      beforeQuery = '',
      afterQuery = 'SELECT * FROM ?? ',
      countQuery = 'SELECT * FROM ?? ';

    // Check if fieldProperty and fValue exist
    if (fieldProperty && fieldValue) {
      // afterQuery
      afterQuery += 'WHERE ?? = ? ';
      afterQueryValues.push(fieldProperty, fieldValue);
      countQuery = afterQuery;
      // Reference Table
      if (currentTable !== destinationTable) {
        // if not the same table
        beforeQuery = 'SELECT * FROM ?? WHERE ?? = ?';
        if (currentTable === 'morphology' && destinationTable === 'lemmata') {
          countQuery = beforeQuery;
          beforeQuery += ' LIMIT ? OFFSET ?';
          beforeQueryValues.push(limit, page * limit);
        }
      }
      afterQuery += 'ORDER BY `Sort_ID` ASC';
    } else {
      switch (destinationTable) {
        case 'text':
          afterQuery += 'ORDER BY `Sort_ID` ASC';
          break;
        case 'sentences':
          afterQuery += 'ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID` ASC';
          break;
        case 'morphology':
          afterQuery += 'ORDER BY `Text_ID`, LENGTH(`Text_Unit_ID`), `Text_Unit_ID`, `Sort_ID` ASC';
          break;
        case 'lemmata':
          afterQuery += 'ORDER BY `Lemma` COLLATE utf8mb4_unicode_ci, `Sort_ID` ASC';
          break;
        default:
          break;
      }
    }
    countQuery = countQuery.replace('*', 'COUNT(`ID`) as numRows');

    if (!(currentTable === 'morphology' && destinationTable === 'lemmata')) {
      afterQuery += ' LIMIT ? OFFSET ?';
      afterQueryValues.push(limit, page * limit);
    }
    console.log('beforeQuery:', beforeQuery);
    console.log('afterQuery:', afterQuery);
    console.log('afterQueryValues:', afterQueryValues);
    console.log(
      countQuery,
      currentTable === 'morphology' && destinationTable === 'lemmata' ? beforeQueryValues : afterQueryValues
    );
    logger.trace('beforeQuery:', beforeQuery);
    logger.info('afterQuery:', afterQuery);
    logger.info('afterQueryValues:', afterQueryValues);
    let beforeTable = [],
      afterTable = [];
    try {
      connection.query(
        countQuery,
        currentTable === 'morphology' && destinationTable === 'lemmata' ? beforeQueryValues : afterQueryValues,
        (error, result) => {
          console.log(result);
          const numRows = result[0].numRows;
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
                  data: { beforeTable, afterTable, numRows }
                });
              });
            } else {
              // logger.trace(results);
              res.status(200).send({
                data: { beforeTable, afterTable, numRows }
              });
            }
          });
        }
      );
    } catch (error) {
      logger.error('Error: ', error);
    }
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
