const auth = require('./auth.js');

// Creates a row if a row is inserted
const createRow = (connection, logger, table, values, user, token, res, next) => {
  auth.isLoggedIn(logger, connection, token, res, true);
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
}

// Add Search Query to Database
const insertSearchQuery = (connection, logger, query, creator, res, next) => {
  connection.query(
    'INSERT INTO `SEARCH` SET ?',
    { Query: query, Creator: creator },
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

// Moves the row if the row is reordered
const moveRow = (connection, logger, table, values, user, token, res, next) => {
  auth.isLoggedIn(logger, connection, token, res, true);
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
}

// Removes a row, if a row is deleted
const removeRow = (connection, logger, table, values, token, res, next) => {
  auth.isLoggedIn(logger, connection, token, res, true);
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
}

// Updates a row if a row is edited
const updateRow = (connection, logger, table, values, token, res, next) => {
  auth.isLoggedIn(logger, connection, token, res, true);
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

module.exports = Object.assign({
  moveRow,
  createRow,
  removeRow,
  updateRow,
  insertSearchQuery
});