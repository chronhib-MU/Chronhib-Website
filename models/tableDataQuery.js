// Search Feature
const searchTable = (connection, logger, req, res, next) => {
  let searchQuery = {};
  try {
    // Check for the Search ID needed
    if (!req.query.id) {
      res.status(404).send({
        message: 'Search ID needed to show search results.',
        title: 'No Search ID found!',
        type: 'error'
      });
    }
    // Look for the Search Query using the Search ID provided
    connection.query('SELECT `Query` FROM `SEARCH` WHERE `ID`= ?', req.query.id, (error, results) => {
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
        const selectedTableColumns = []; // ['`TEXT`.`Text_ID`', '`SENTENCES`.`Textual_Unit`']
        const selectStart = options?.duplicateRows ? 'SELECT ' : 'SELECT DISTINCT ';
        // Stores all the Tables & Columsn that need to be viewed
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
          parseInt(req.query.limit) > 0
            ? parseInt(req.query.limit)
            : parseInt(options.limit) > 0
              ? parseInt(options.limit)
              : 100;
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 0;
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
          countQuery += 'DISTINCT ';
        }
        countQuery +=
          selectedTableColumns.toString() +
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
                message: 'Search ID ' + req.query.id + ' does not exist.',
                title: 'Invalid Search ID!',
                type: 'error'
              });
            }
          });
        } catch (error) {
          console.log('Error: ', error);
          logger.info({ id: req.query.id, searchQuery });
          logger.error(error);
        }
      } else { // If the Search Query doesn't exist or if no Search ID is provided
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
}

// Gets the Table Data from the pages navigated to, on the main table
const navigateTable = (connection, logger, req, res, next) => {
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
}

const getTableColumnRows = (connection, logger, table, column, filter, res, next) => {
  let query = `SELECT ?? FROM ??`;
  let queryValues = [column, table];
  if (filter !== null) {
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
      const filteredResults = [...new Set(results.map(data => data[column]))].filter(data => data);
      console.log(filteredResults);
      res.status(200).send(filteredResults);
    }
  });
}

const getHeaders = (connection, logger, path, DATABASE, res, next) => {
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
        data: results.map(result => result.COLUMN_NAME)
      });
    }
  });
}

module.exports = Object.assign({
  searchTable,
  navigateTable,
  getTableColumnRows,
  getHeaders
});
