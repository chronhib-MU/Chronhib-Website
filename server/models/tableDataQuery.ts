import { Query, Response, NextFunction } from 'express-serve-static-core';
import { Logger } from 'log4js';
import { Connection } from 'mysql';

// Search Feature
const searchTable = (
  connection: Connection,
  logger: Logger,
  query: Query,
  res: Response,
  next: NextFunction
): void => {
  let searchQuery: {
    conditions: {
      negated: boolean,
      caseSensitive: boolean,
      accentSensitive: boolean,
      table: string,
      column: string,
      operator: string,
      comparator: string,
      comparatorVal: string
    }[],
    options: {
      noConditions: boolean,
      duplicateRows: boolean,
      limit: string
    },
    tableColumns: {
      table: string,
      column: {
        [key: string]: string | number
      }[]
    }[];
  };
  try {
    // Check for the Search ID needed
    if (!query.id) {
      res.status(404).send({
        message: 'Search ID needed to show search results.',
        title: 'No Search ID found!',
        type: 'error'
      });
    }
    // Look for the Search Query using the Search ID provided
    connection.query('SELECT `Query` FROM `SEARCH` WHERE `ID`= ?', query.id, (error, results): void => {
      // If there was an error in the Query, log the error
      if (error) {
        // console.log(error);
        logger.error(error);
        next(error);
      } // Check if the Search Query exists in the database
      else if (results[0] && JSON.parse(results[0]?.Query)) {
        searchQuery = JSON.parse(results[0].Query); // Store the Search Query results
        // console.log('tableColumn', req.body);
        console.log('Search Query:', searchQuery)
        const { conditions, options, tableColumns } = searchQuery;
        // Select
        const selectedTableColumns: string[] = []; // ['`TEXT`.`Text_ID`', '`SENTENCES`.`Textual_Unit`']
        const selectStart = options.duplicateRows ? 'SELECT ' : 'SELECT DISTINCT ';
        // Stores all the Tables & Columns that need to be viewed
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
          const innerJoinConnections: { [key: string]: { [key: string]: string } } = {
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
          const unique: { [key: string]: boolean } = {
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

        // Creates the Where Conditions
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
            const conditionComparator = comparator;
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
        if (
          typeof query.limit === 'string' &&
          typeof query.page === 'string'
        ) {
          const limit =
            parseInt(query.limit) > 0
              ? parseInt(query.limit)
              : parseInt(options.limit) > 0
                ? parseInt(options.limit)
                : 100;
          const page = parseInt(query.page) > 0 ? parseInt(query.page) : 0;
          // console.log(limit, page);
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
            countQuery += 'DISTINCT ' + selectedTableColumns.toString() +
              ') as numRows ';

          } else {
            countQuery += selectedTableColumns[0] +
              ') as numRows ';
          }
          countQuery +=
            fromInnerJoins.join(' ') +
            (options.noConditions ? '' : whereConditions.join(' '));
          try {
            console.log('Count Query: ', countQuery);
            connection.query(countQuery, (error, result) => {
              if (error) {
                console.log('Error: ', error);
                logger.info({ id: query.id, searchQuery });
                logger.error(error);
                next(error);
              }
              else if (result) {
                const numRows = result[0].numRows;
                console.log('Offset: ', page * limit);

                finalQuery += ' OFFSET ' + page * limit + ';';
                console.log('Final Query: ', finalQuery);
                connection.query(finalQuery, (err, results) => {
                  if (err) {
                    console.log('Error: ', err);
                    logger.info({ id: query.id, searchQuery });
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
                  message: 'Search ID ' + query.id + ' does not exist.',
                  title: 'Invalid Search ID!',
                  type: 'error'
                });
              }
            });
          } catch (error) {
            console.log('Error: ', error);
            logger.info({ id: query.id, searchQuery });
            logger.error(error);
          }
        }
      } else { // If the Search Query doesn't exist or if no Search ID is provided
        logger.error('Error: Search ID does not exist - ', query.id);
        res.status(404).send({
          message: query.id ? 'Search ID ' + query.id + ' does not exist.' : 'Search ID needed to show query.',
          title: query.id ? 'Invalid Search ID!' : 'No Search ID found!',
          type: 'error'
        });
      }
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Gets the Table Data from the pages navigated to, on the main table
const navigateTable = (
  connection: Connection,
  logger: Logger,
  query: Query,
  res: Response, next: NextFunction): void => {
  if (
    typeof query.limit === 'string' &&
    typeof query.page === 'string' &&
    (typeof query.fprop === 'string' || !query.fprop) &&
    (typeof query.fval === 'string' || !query.fval) &&
    typeof query.dtable === 'string' &&
    typeof query.ctable === 'string') {
    const page: number = (parseInt(query.page, 10) > 0 ? parseInt(query.page, 10) : 0) || 0, // pagination page number
      limit: number = (parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 100) || 100, // pagination limit (how many rows per page)
      fieldProperty = query.fprop || '', // the property to filter by
      fieldValue: (string | number) = query.fval || '', // the value of the property to filter by
      destinationTable: string = query.dtable || 'text', // the table we're navigating to
      currentTable: string = query.ctable || 'text', // the table we're navigating from
      beforeQueryValues: (string | number)[] = [currentTable.toUpperCase(), fieldProperty, fieldValue],
      afterQueryValues: (string | number)[] = [destinationTable.toUpperCase()];

    let beforeQuery = '',
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
    try {
      connection.query(
        countQuery,
        currentTable === 'morphology' && destinationTable === 'lemmata' ? beforeQueryValues : afterQueryValues,
        (error, result) => {
          if (error) {
            logger.error('Error: ', error)
            next(error);
          }
          console.log(result);
          const numRows = result[0].numRows;
          connection.query(afterQuery, afterQueryValues, (err, results) => {
            let beforeTable: string[] = [],
              afterTable: string[] = [];
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
    console.log('Error Occurred:', query);
    res.status(404);
  }
}

const getTableColumnRows = (connection: Connection, logger: Logger, table: string, column: string, filter: string, res: Response, next: NextFunction): void => {
  let query = `SELECT ?? FROM ??`;
  let queryValues = [column, table];
  if (typeof filter !== null) {
    query += ` WHERE ?? LIKE ?;`;
    queryValues = [column, table, column, '%' + filter + '%'];
  }
  console.log(query);
  console.log(queryValues);
  connection.query(query, queryValues, (err, results) => {
    if (err) {
      // console.log('Error: ', err);
      logger.error('Error: ', err);
      next(err);
      // res.status(200).send([]);
    } else {
      // Extract columns from Rows
      // Remove Unique values with Set
      // Remove null or empty results
      const filteredResults = [...new Set(results.map((data: { [key: string]: (string | number); }) => data[column]))].filter(data => data);
      console.log(filteredResults);
      res.status(200).send(filteredResults);
    }
  });
}

const getHeaders = (connection: Connection, logger: Logger, path: string, DATABASE: string | undefined, res: Response, next: NextFunction): void => {
  // console.log(tables[path]);
  logger.trace(path);
  const headerQuery = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = N?';
  connection.query(headerQuery, [DATABASE, path.split('/')[0].toUpperCase()], (err, results) => {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      // console.log(results);
      logger.trace(results);
      res.status(200).send({
        data: results.map((result: { COLUMN_NAME: string; }) => result.COLUMN_NAME)
      });
    }
  });
}

export {
  searchTable,
  navigateTable,
  getTableColumnRows,
  getHeaders
};
