import { Response, NextFunction } from 'express-serve-static-core';
import { Logger } from 'log4js';
import { Connection } from 'mysql';
import { isLoggedIn } from './auth';

// Creates a row if a row is inserted
function createRow (
  connection: Connection,
  logger: Logger,
  table: string,
  tableStructures: { [key: string]: { [key: string]: string | null } },
  values: { fprop: string | undefined; fval: string | undefined; }[],
  user: { First_Name: string; Last_Name: string; Email: string; },
  token: string,
  res: Response,
  next: NextFunction
): void {
  isLoggedIn(logger, connection, token, res, true);
  // console.log('Row Values: ', values);
  // console.log('Row Table: ', table);
  // logger.trace(values);
  console.log('Table Structures: ', tableStructures);
  console.log([table, Object.keys(tableStructures[table]), Object.values(tableStructures[table])]);
  let query = connection.query('INSERT INTO ?? (??) VALUES (?);', [table, Object.keys(tableStructures[table]), Object.values(tableStructures[table])], (error: unknown, result: { insertId: { toString: () => string; }; }) => {
    if (error) {
      // console.log(error);
      logger.error('Error: ', { Error: error, User: user });
      next(error);
    } else {
      const id = parseInt(result.insertId.toString());
      logger.trace('Success: ', { Results: result, User: user });
      const tableSortID = table + '.Sort_ID';
      const tableID = table + '.ID';
      let createRowQuery: Array<string> = [];
      let createRowValues: Array<string | number>[] = [];
      if (values.length && values[0].fprop && values[0].fval) {
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
      console.log('Connection Query 0: ', query.sql);
      // Updates Sort ID
      query = connection.query(createRowQuery[1], createRowValues[1], (err: unknown, result: unknown) => {
        if (err) {
          console.log('Error: ', { Error: err, User: user });
          logger.error('Error: ', { Error: err, User: user });
          next(err);
        } else {
          console.log(result);
          console.log('Connection Query 1: ', query.sql);
          console.log('createRowQuery Length: ', createRowQuery, createRowQuery.length);
          if (createRowQuery.length > 1) {
            // Updates FProps and FVals if added
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
}

// Add Search Query to Database
function insertSearchQuery (connection: Connection, logger: Logger, query: string, creator: string, res: Response, next: NextFunction): void {
  connection.query(
    'INSERT INTO `SEARCH` SET ?',
    { Query: query, Creator: creator },
    (error: unknown, result: { insertId: { toString: () => string; }; }) => {
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

// Moves the row if the row is reordered
function moveRow (connection: Connection,
  logger: Logger,
  table: string,
  values: { Sort_ID: number; ID: number; }[][],
  user: { First_Name: string; Last_Name: string; Email: string; },
  token: string,
  res: Response,
  next: NextFunction): void {
  isLoggedIn(logger, connection, token, res, true);
  const updateQueries: { query: string; values: [string, number, number]; }[] = [];
  values[0].forEach(rowData => {
    const query = 'UPDATE ?? SET `Sort_ID` = ? WHERE `ID` = ?;';
    updateQueries.push({ query, values: [table, rowData.Sort_ID, rowData.ID] });
  });
  updateQueries.forEach(updateQuery => {
    // console.log('Post Query: ', updateQuery);
    logger.info('Post Query: ', updateQuery);
    connection.query(updateQuery.query, updateQuery.values, (err: unknown, results: unknown) => {
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
}

// Removes a row, if a row is deleted
function removeRow (connection: Connection, logger: Logger, table: string, values: string[], token: string, res: Response, next: NextFunction): void {
  isLoggedIn(logger, connection, token, res, true);
  console.log('Remove Row: ', values);
  const query = 'DELETE FROM ?? WHERE `ID` IN (?);';
  connection.query(query, [table, values], (err: unknown, result: unknown) => {
    if (err) {
      // console.log('Error: ', err);
      logger.error('Error: ', err);
      next(err);
    } else {
      console.log('Remove result: ', result);
      res.status(200).end();
    }
  });
}

// Updates a row if a row is edited
function updateRow (connection: Connection, logger: Logger, table: string, values: { id: number; fieldProperty: string; fieldValue: string | number; }[], token: string, res: Response, next: NextFunction): void {
  isLoggedIn(logger, connection, token, res, true);
  values.forEach(value => {
    // console.log(value);
    const { id, fieldProperty, } = value;
    let { fieldValue } = value;
    fieldValue = fieldValue === null ? '' : fieldValue;
    console.table({ id, fieldProperty, fieldValue });
    const updateQuery = 'UPDATE ?? SET ?? = ? WHERE `ID` = ?;';
    // console.log('Post Query: ', updateQuery);
    logger.info('Post Query: ', [updateQuery, ...[table, fieldProperty, fieldValue, id]]);
    connection.query(updateQuery, [table, fieldProperty, fieldValue, id], (err: unknown, results: unknown) => {
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


export {
  moveRow,
  createRow,
  removeRow,
  updateRow,
  insertSearchQuery,
};
