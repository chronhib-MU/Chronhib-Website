"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
// Search Feature
var searchTable = function (connection, logger, req, res, next) {
    var searchQuery = {};
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
        connection.query('SELECT `Query` FROM `SEARCH` WHERE `ID`= ?', req.query.id, function (error, results) {
            var _a;
            // If there was an error in the Query, log the error
            if (error) {
                // console.log(error);
                logger.error(error);
                next(error);
            } // Check if the Search Query exists in the database
            else if (results[0] && JSON.parse((_a = results[0]) === null || _a === void 0 ? void 0 : _a.Query)) {
                searchQuery = JSON.parse(results[0].Query); // Store the Search Query results
                // console.log('tableColumn', req.body);
                console.log('Search Query:', searchQuery);
                var conditions = searchQuery.conditions, options = searchQuery.options, tableColumns = searchQuery.tableColumns;
                // Select
                var selectedTableColumns_1 = []; // ['`TEXT`.`Text_ID`', '`SENTENCES`.`Textual_Unit`']
                var selectStart = (options === null || options === void 0 ? void 0 : options.duplicateRows) ? 'SELECT ' : 'SELECT DISTINCT ';
                // Stores all the Tables & Columsn that need to be viewed
                tableColumns.forEach(function (obj) {
                    Object.values(obj.column).forEach(function (column) { return selectedTableColumns_1.push(obj.table + '.' + column); });
                });
                var selectedTables_1 = tableColumns.map(function (tableColumn) { return tableColumn.table; });
                // From
                if (!options.noConditions)
                    selectedTables_1 = selectedTables_1.concat(conditions.map(function (condition) { return condition.table; }));
                // Removes Duplicate Tables
                selectedTables_1 = selectedTables_1.filter(function (table, index) { return selectedTables_1.indexOf(table) === index; });
                /** Now we know what tables need to be joined
                 *  We need to add MORPHOLOGY to the list of tables to be joined -
                 *  if there are more than 2 tables and 1 of them is LEMMATA,
                 *  since it's the link to the other tables
                 */
                var fromInnerJoins = [' FROM'];
                if (selectedTables_1.length > 1) {
                    fromInnerJoins.push(selectedTables_1[0]);
                    if (selectedTables_1.includes('LEMMATA') && !selectedTables_1.includes('MORPHOLOGY')) {
                        selectedTables_1.push('MORPHOLOGY');
                    }
                    var innerJoinConnections = {
                        TEXT: {
                            SENTENCES: "INNER JOIN SENTENCES ON TEXT.Text_ID = SENTENCES.Text_ID",
                            MORPHOLOGY: "INNER JOIN MORPHOLOGY ON TEXT.Text_ID = MORPHOLOGY.Text_ID"
                        },
                        SENTENCES: {
                            TEXT: "INNER JOIN TEXT ON SENTENCES.Text_ID = TEXT.Text_ID",
                            MORPHOLOGY: "INNER JOIN MORPHOLOGY ON SENTENCES.Text_Unit_ID = MORPHOLOGY.Text_Unit_ID"
                        },
                        MORPHOLOGY: {
                            TEXT: "INNER JOIN TEXT ON MORPHOLOGY.Text_ID = TEXT.Text_ID",
                            SENTENCES: "INNER JOIN SENTENCES ON MORPHOLOGY.Text_Unit_ID = SENTENCES.Text_Unit_ID",
                            LEMMATA: "INNER JOIN LEMMATA ON MORPHOLOGY.Lemma = LEMMATA.Lemma"
                        },
                        LEMMATA: {
                            MORPHOLOGY: "INNER JOIN MORPHOLOGY ON LEMMATA.Lemma = MORPHOLOGY.Lemma"
                        }
                    };
                    // This is to stop sql from complaining about non-unique tables/aliases
                    var unique = {
                        TEXT: true,
                        SENTENCES: true,
                        MORPHOLOGY: true,
                        LEMMATA: true
                    };
                    if (selectedTables_1.length > 1) {
                        for (var i = 0; i < selectedTables_1.length; i++) {
                            var tableI = selectedTables_1[i];
                            for (var j = 1; j < selectedTables_1.length; j++) {
                                var tableJ = selectedTables_1[j];
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
                }
                else {
                    fromInnerJoins.push(selectedTables_1[0]);
                }
                // Creates the Where Conditions
                var whereConditions_1 = [' WHERE'];
                if (!options.noConditions) {
                    conditions.forEach(function (condition) {
                        if (condition.operator) {
                            whereConditions_1.push(condition.operator);
                        }
                        if (condition.negated) {
                            whereConditions_1.push('NOT');
                        }
                        var comparator, comparatorVal;
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
                                            .map(function (values) { return connection.escape(values); })
                                            .toString() +
                                        ')';
                                break;
                            default:
                                comparator = condition.comparator;
                                comparatorVal = connection.escape(condition.comparatorVal);
                                break;
                        }
                        var conditionTableColumn = condition.table + '.' + condition.column;
                        var conditionComparator = comparator;
                        var conditionComparatorVal = comparatorVal;
                        var excludeCollation = ['ID', 'Sort_ID', 'Timestamp', 'Text_Unit_ID', 'Text_ID'];
                        // Accent and Case Sensitivity should not affect the above columns
                        // Also, there's no way to make accent sensitive queries also case sensitive
                        if (!excludeCollation.includes(condition.column)) {
                            if (comparator === 'IN') {
                                if (!condition.accentSensitive) {
                                    conditionTableColumn = conditionTableColumn + ' COLLATE utf8mb4_general_ci';
                                    conditionComparatorVal = conditionComparatorVal + ' COLLATE utf8_general_ci';
                                }
                                else if (!condition.caseSensitive) {
                                    conditionTableColumn = 'LOWER(' + conditionTableColumn + ')';
                                    conditionComparatorVal = 'LOWER(' + conditionComparatorVal + ')';
                                }
                            }
                            else {
                                if (!condition.accentSensitive) {
                                    conditionTableColumn = conditionTableColumn + ' COLLATE utf8mb4_general_ci';
                                    conditionComparatorVal = conditionComparatorVal + ' COLLATE utf8_general_ci';
                                }
                                else if (!condition.caseSensitive) {
                                    conditionTableColumn = 'LOWER(' + conditionTableColumn + ')';
                                    conditionComparatorVal = 'LOWER(' + conditionComparatorVal + ')';
                                }
                            }
                        }
                        whereConditions_1.push(conditionTableColumn, conditionComparator, conditionComparatorVal);
                    });
                    logger.info('Where pre brackets: ', JSON.stringify(whereConditions_1));
                    if (whereConditions_1.includes('AND')) {
                        var openBracket = false;
                        for (var index = 2; index < whereConditions_1.length; index += 2) {
                            if (whereConditions_1[index] === 'AND' && openBracket === true) {
                                whereConditions_1.splice(index, 0, ')'); // Add a closing bracket to the previous index in between the last condition and this and operator
                                index++; // To compensate for the added element in the array
                                openBracket = false;
                            }
                            else if (whereConditions_1[index] === 'OR' && openBracket === false) {
                                whereConditions_1.splice(index - 3, 0, '('); // Add opening bracket before previous condition
                                index++; // To compensate for the added element in the array
                                openBracket = true;
                            }
                        }
                        // We've finished going through the where conditions
                        if (openBracket === true) {
                            whereConditions_1.push(')'); // If there's still an openBracket then we add a closing bracket at the very last index
                        }
                    }
                }
                var limit_1 = parseInt(req.query.limit) > 0
                    ? parseInt(req.query.limit)
                    : parseInt(options.limit) > 0
                        ? parseInt(options.limit)
                        : 100;
                var page_1 = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 0;
                // console.log(limit, page);
                var finalQuery_1 = selectStart +
                    selectedTableColumns_1.join(', ') +
                    fromInnerJoins.join(' ') +
                    (options.noConditions ? '' : whereConditions_1.join(' ')) +
                    ' LIMIT ' +
                    limit_1;
                logger.info('Search Query: ', finalQuery_1);
                var countQuery = 'SELECT COUNT(';
                if (!options.duplicateRows) {
                    countQuery += 'DISTINCT ' + selectedTableColumns_1.toString() +
                        ') as numRows ';
                }
                else {
                    countQuery += selectedTableColumns_1[0] +
                        ') as numRows ';
                }
                countQuery +=
                    fromInnerJoins.join(' ') +
                        (options.noConditions ? '' : whereConditions_1.join(' '));
                try {
                    console.log('Count Query: ', countQuery);
                    connection.query(countQuery, function (error, result) {
                        if (error) {
                            console.log('Error: ', error);
                            logger.info({ id: req.query.id, searchQuery: searchQuery });
                            logger.error(error);
                            next(err);
                        }
                        else if (result) {
                            var numRows_1 = result[0].numRows;
                            console.log('Offset: ', page_1 * limit_1);
                            finalQuery_1 += ' OFFSET ' + page_1 * limit_1 + ';';
                            console.log('Final Query: ', finalQuery_1);
                            connection.query(finalQuery_1, function (err, results) {
                                if (err) {
                                    console.log('Error: ', err);
                                    logger.info({ id: req.query.id, searchQuery: searchQuery });
                                    logger.error(err);
                                    next(err);
                                }
                                else {
                                    res.status(200).send({
                                        data: { beforeTable: searchQuery, afterTable: results, numRows: numRows_1 }
                                    });
                                }
                            });
                        }
                        else {
                            res.status(400).send({
                                message: 'Search ID ' + req.query.id + ' does not exist.',
                                title: 'Invalid Search ID!',
                                type: 'error'
                            });
                        }
                    });
                }
                catch (error) {
                    console.log('Error: ', error);
                    logger.info({ id: req.query.id, searchQuery: searchQuery });
                    logger.error(error);
                }
            }
            else { // If the Search Query doesn't exist or if no Search ID is provided
                logger.error('Error: Search ID does not exist - ', req.query.id);
                res.status(404).send({
                    message: req.query.id ? 'Search ID ' + req.query.id + ' does not exist.' : 'Search ID needed to show query.',
                    title: req.query.id ? 'Invalid Search ID!' : 'No Search ID found!',
                    type: 'error'
                });
            }
        });
    }
    catch (error) {
        logger.error(error);
        next(error);
    }
};
// Gets the Table Data from the pages navigated to, on the main table
var navigateTable = function (connection, logger, req, res, next) {
    var page = (parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 0) || 0, // pagination page number
    limit = (parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 100) || 100, // pagination limit (how many rows per page)
    fieldProperty = req.query.fprop || '', // the property to filter by
    fieldValue = req.query.fval || '', // the value of the property to filter by
    destinationTable = req.query.dtable || 'text', // the table we're navigating to
    currentTable = req.query.ctable || 'text', // the table we're navigating from
    beforeQueryValues = [currentTable.toUpperCase(), fieldProperty, fieldValue], afterQueryValues = [destinationTable.toUpperCase()], beforeQuery = '', afterQuery = 'SELECT * FROM ?? ', countQuery = 'SELECT * FROM ?? ';
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
    }
    else {
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
    console.log(countQuery, currentTable === 'morphology' && destinationTable === 'lemmata' ? beforeQueryValues : afterQueryValues);
    logger.trace('beforeQuery:', beforeQuery);
    logger.info('afterQuery:', afterQuery);
    logger.info('afterQueryValues:', afterQueryValues);
    var beforeTable = [], afterTable = [];
    try {
        connection.query(countQuery, currentTable === 'morphology' && destinationTable === 'lemmata' ? beforeQueryValues : afterQueryValues, function (error, result) {
            console.log(result);
            var numRows = result[0].numRows;
            connection.query(afterQuery, afterQueryValues, function (err, results) {
                if (err) {
                    // console.log('Error: ', err);
                    logger.error('Error: ', err);
                    next(err);
                }
                else {
                    afterTable = results;
                }
                if (beforeQuery !== '') {
                    connection.query(beforeQuery, beforeQueryValues, function (err, results) {
                        if (err) {
                            // console.log('Error: ', err);
                            logger.error('Error: ', err);
                            next(err);
                        }
                        else {
                            beforeTable = results;
                        }
                        // console.log({ beforeTable, afterTable });
                        // logger.info(results);
                        res.status(200).send({
                            data: { beforeTable: beforeTable, afterTable: afterTable, numRows: numRows }
                        });
                    });
                }
                else {
                    // logger.trace(results);
                    res.status(200).send({
                        data: { beforeTable: beforeTable, afterTable: afterTable, numRows: numRows }
                    });
                }
            });
        });
    }
    catch (error) {
        logger.error('Error: ', error);
    }
};
var getTableColumnRows = function (connection, logger, table, column, filter, res, next) {
    var query = "SELECT ?? FROM ??";
    var queryValues = [column, table];
    if (filter !== null) {
        query += " WHERE ?? LIKE ?;";
        queryValues = [column, table, column, '%' + filter + '%'];
    }
    console.log(query);
    console.log(queryValues);
    connection.query(query, queryValues, function (err, results) {
        if (err) {
            // console.log('Error: ', err);
            logger.error('Error: ', err);
            next(err);
            // res.status(200).send([]);
        }
        else {
            // Extract columns from Rows
            // Remove Unique values with Set
            // Remove null or empty results
            var filteredResults = __spreadArrays(new Set(results.map(function (data) { return data[column]; }))).filter(function (data) { return data; });
            console.log(filteredResults);
            res.status(200).send(filteredResults);
        }
    });
};
var getHeaders = function (connection, logger, path, DATABASE, res, next) {
    // console.log(tables[path]);
    logger.trace(path);
    var headerQuery = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = N?';
    connection.query(headerQuery, [DATABASE, path.split('/')[0].toUpperCase()], function (err, results) {
        if (err) {
            logger.error(err);
            next(err);
        }
        else {
            // console.log(results);
            logger.trace(results);
            res.status(200).send({
                data: results.map(function (result) { return result.COLUMN_NAME; })
            });
        }
    });
};
module.exports = Object.assign({
    searchTable: searchTable,
    navigateTable: navigateTable,
    getTableColumnRows: getTableColumnRows,
    getHeaders: getHeaders
});
//# sourceMappingURL=tableDataQuery.js.map