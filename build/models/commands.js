"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSearchQuery = exports.updateRow = exports.removeRow = exports.createRow = exports.moveRow = void 0;
var auth_1 = require("./auth");
// Creates a row if a row is inserted
var createRow = function (connection, logger, table, values, user, token, res, next) {
    auth_1.isLoggedIn(logger, connection, token, res, true);
    console.log('Row Values: ', values);
    console.log('Row Table: ', table);
    // logger.trace(values);
    var tableStructures = {
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
    var query = connection.query('INSERT INTO ?? (??) VALUES (?);', [table, Object.keys(tableStructures[table]), Object.values(tableStructures[table])], function (error, result) {
        if (error) {
            // console.log(error);
            logger.error('Error: ', { Error: error, User: user });
            next(error);
        }
        else {
            var id = parseInt(result.insertId.toString());
            logger.trace('Success: ', { Results: result, User: user });
            var tableSortID = table + '.Sort_ID';
            var tableID = table + '.ID';
            var createRowQuery_1 = [];
            var createRowValues_1 = [];
            if (values[0].fprop && values[0].fval) {
                var tableFProp = table + '.' + values[0].fprop;
                createRowQuery_1 =
                    ['UPDATE ?? SET ?? = ? WHERE ?? = ?;', 'UPDATE ?? SET ?? = ? WHERE ?? = ?;'];
                createRowValues_1 = [[table, tableSortID, id, tableID, id]];
                createRowValues_1.push([table, tableFProp, values[0].fval, tableID, id]);
            }
            else {
                createRowQuery_1 = ['UPDATE ?? SET ?? = ? WHERE ?? = ?;'];
                createRowValues_1 = [[table, tableSortID, id, tableID, id]];
            }
            console.log('Create Row Query: ', createRowQuery_1);
            console.log('Create Row Values: ', createRowValues_1);
            console.log('Connection Query 0: ', query.sql);
            query = connection.query(createRowQuery_1[0], createRowValues_1[0], function (err, result) {
                if (err) {
                    console.log('Error: ', { Error: err, User: user });
                    logger.error('Error: ', { Error: err, User: user });
                    next(err);
                }
                else {
                    console.log(result);
                    console.log('Connection Query 1: ', query.sql);
                    console.log('createRowQuery Length: ', createRowQuery_1, createRowQuery_1.length);
                    if (createRowQuery_1.length > 1) {
                        query = connection.query(createRowQuery_1[1], createRowValues_1[1], function (err, result) {
                            if (err) {
                                console.log('Error: ', { Error: err, User: user });
                                logger.error('Error: ', { Error: err, User: user });
                                next(err);
                            }
                            else {
                                console.log(result);
                                console.log('Connection Query 2: ', query.sql);
                                res.status(200).end();
                            }
                        });
                    }
                    else {
                        res.status(200).end();
                    }
                }
            });
        }
    });
};
exports.createRow = createRow;
// Add Search Query to Database
var insertSearchQuery = function (connection, logger, query, creator, res, next) {
    connection.query('INSERT INTO `SEARCH` SET ?', { Query: query, Creator: creator }, function (error, result) {
        if (error) {
            // console.log(error);
            logger.error(error);
            next(error);
        }
        else {
            res.status(200).end(result.insertId.toString());
        }
    });
};
exports.insertSearchQuery = insertSearchQuery;
// Moves the row if the row is reordered
var moveRow = function (connection, logger, table, values, user, token, res, next) {
    auth_1.isLoggedIn(logger, connection, token, res, true);
    var updateQueries = [];
    values[0].forEach(function (rowData) {
        var query = 'UPDATE ?? SET `Sort_ID` = ? WHERE `ID` = ?;';
        updateQueries.push({ query: query, values: [table, rowData.Sort_ID, rowData.ID] });
    });
    updateQueries.forEach(function (updateQuery) {
        // console.log('Post Query: ', updateQuery);
        logger.info('Post Query: ', updateQuery);
        connection.query(updateQuery.query, updateQuery.values, function (err, results) {
            if (err) {
                // console.log('Error: ', err);
                logger.error('Error: ', { Error: err, User: user });
                next(err);
            }
            else {
                // console.log('Success: ', results);
                logger.trace('Success: ', { Results: results, User: user });
                res.status(200).end();
            }
            // console.log({ beforeTable, afterTable });
        });
    });
};
exports.moveRow = moveRow;
// Removes a row, if a row is deleted
var removeRow = function (connection, logger, table, values, token, res, next) {
    auth_1.isLoggedIn(logger, connection, token, res, true);
    console.log(values);
    var query = 'DELETE FROM ?? WHERE `ID` IN (?);';
    connection.query(query, [table, values], function (err, result) {
        if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', err);
            next(err);
        }
        else {
            console.log(result);
            res.status(200).end();
        }
    });
};
exports.removeRow = removeRow;
// Updates a row if a row is edited
var updateRow = function (connection, logger, table, values, token, res, next) {
    auth_1.isLoggedIn(logger, connection, token, res, true);
    values.forEach(function (value) {
        // console.log(value);
        var id = value.id, fieldProperty = value.fieldProperty;
        var fieldValue = value.fieldValue;
        fieldValue = fieldValue === null ? '' : fieldValue;
        console.table({ id: id, fieldProperty: fieldProperty, fieldValue: fieldValue });
        var updateQuery = 'UPDATE ?? SET ?? = ? WHERE `ID` = ?;';
        // console.log('Post Query: ', updateQuery);
        logger.info('Post Query: ', __spread([updateQuery], [table, fieldProperty, fieldValue, id]));
        connection.query(updateQuery, [table, fieldProperty, fieldValue, id], function (err, results) {
            if (err) {
                // console.log('Error: ', err);
                logger.error('Error: ', err);
                next(err);
            }
            else {
                logger.trace('Success: ', results);
                res.status(200).end();
            }
            // console.log({ beforeTable, afterTable });
        });
    });
};
exports.updateRow = updateRow;
//# sourceMappingURL=commands.js.map