import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Redirect } from 'react-router-dom';
import ReactDataGrid from 'react-data-grid';
import ReactPaginate from 'react-paginate';
import { Toolbar, Data } from 'react-data-grid-addons';
// import PropTypes from 'prop-types';

// reactstrap components
import { Card, Container, Row, CardBody, CardTitle, Col, CardHeader } from 'reactstrap';

// core components and styles
import Header from '../../components/Headers/Header.js';
import './Tables.scss';
import { tables, updateData } from '../../variables/tableData';

import _ from 'lodash';

const {
  // @ts-ignore
  Draggable: { Container: DraggableContainer, RowActionsCell, DropTargetRowContainer }
} = require('react-data-grid-addons');
const RowRenderer = DropTargetRowContainer(ReactDataGrid.Row);

const selectors = Data.Selectors;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}
// Tables.defaultProps = { rowKey: 'id' };
function Tables(props) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [rows, setRows] = useState([]);
  const [rowKey, setRowKey] = useState('ID_unique_number');
  const [edit, setEdit] = useState(false);
  // let rowKey = 'ID_unique_number';
  const firstNameActions = [
    {
      icon: <span className="ni ni-bold-right" />,
      callback: () => {
        alert('Deleting');
      }
    }
  ];
  let columns, columnKeys;
  useEffect(() => {
    console.log('UseEffect: I work', table);
    if (table && tables.names.includes(table) && !rows.length) {
      console.log('I am going to set Rows in effect now. NOT! :P');
      setRows(
        tables[table].data.map(row =>
          _.zipObject(
            columnKeys,
            columnKeys.map(columnKey => row[columnKey])
          )
        )
      );
      console.log('It should have worked now', rows);
      // console.log('columns', columns);
      // console.log('filteredRows', filteredRows);
    }
  }, []);
  let { table, id } = useParams();
  // let filteredRows = [];
  // console.log(table);
  let currentPage = parseInt(useQuery().get('page'), 10) || 1;
  const onGridRowsUpdated = ({ fromRow, toRow, updated, fromRowData }) => {
    // updates the grid rows
    let newRows = _.slice(rows, fromRow, toRow + 1); // the rows to be changed
    let loc = _.findIndex(tables[table].data, fromRowData);
    // console.log('*************');
    // console.log('fromRow', fromRow);
    // console.log('toRow', toRow);
    console.table(newRows);
    console.log('updated', updated);
    console.log('fromRowData', fromRowData);
    console.log(tables[table].data[loc]);
    newRows.forEach(newRow => {
      loc = _.findIndex(tables[table].data, newRow);
      let newDataRow = _.mergeWith(tables[table].data[loc], updated, (objValue, srcValue) => {
        if (_.isArray(objValue)) {
          return srcValue;
        }
      });
      updateData({ ...table, [`${table}.data[${loc}]`]: newDataRow });
    });
    // console.log(dataTables[table][loc]);
    // console.log('tables', dataTables[table]);
    // console.log('*************');
  };
  const isDraggedRowSelected = (selectedRows, rowDragSource) => {
    console.log('DraggedSelected: this is fine');

    if (selectedRows && selectedRows.length > 0) {
      let key = rowKey;
      return selectedRows.filter(r => r[key] === rowDragSource.data[key]).length > 0;
    }
    return false;
  };
  const reorderRows = e => {
    console.log('reorderRows: this is fine');
    let selectedRows = selectors.getSelectedRowsByKey({
      rowKey: rowKey,
      selectedKeys: selectedIds,
      rows
    });
    let draggedRows = isDraggedRowSelected(selectedRows, e.rowSource) ? selectedRows : [e.rowSource.data];
    let undraggedRows = rows.filter(r => draggedRows.indexOf(r) === -1);
    let args = [e.rowTarget.idx, 0].concat(draggedRows);
    console.log('args', args);
    Array.prototype.splice.apply(undraggedRows, args);
    // filteredRows = getRows(undraggedRows, filters);
    setRows(undraggedRows);
    console.log(rows);
  };

  const onRowsSelected = rows => {
    console.log('Selected: this is fine');
    setSelectedIds(selectedIds.concat(rows.map(r => r.row[rowKey])));
  };

  const onRowsDeselected = rows => {
    console.log('Deselected: this is fine');
    let rowIds = rows.map(r => r.row[rowKey]);
    setSelectedIds(selectedIds.filter(i => rowIds.indexOf(i) === -1));
  };
  const getCellActions = (column, row) => {
    const cellActions = {
      firstName: firstNameActions
    };
    return cellActions[column.key];
  };
  const renderTables = () => {
    console.log('I just rendered');
    if (table) {
      // check if theres a table parameter
      console.log('columns in render', columns);
      if (tables.names.includes(table)) {
        // check if theres a table parameter
        // checks that its a valid table
        // console.log('rowKey:', rowKey);
        console.log('columns before change', columns);
        columns = _.zip(tables[table].bodies, tables[table].headers).map(header => {
          const res = {
            key: header[0],
            name: header[1],
            editable: edit,
            resizable: true,
            filterable: true
          };
          // console.table(res);
          return res;
        });
        console.log('columns after change', columns);
        if (columns) {
          columnKeys = columns.map(column => column.key);
          // If this gives an error make sure the sql server is running

          console.log(columns);
          return (
            <Col>
              <Card className="shadow">
                {/* Table Header */}
                <CardHeader className="border-0">
                  <h2 className="mb-0">{_.capitalize(table)}</h2>
                </CardHeader>
                {/* Table Body */}
                {id && table !== 'text' ? (
                  () => {
                    // checks if it only wants a subset of the data
                    return <div />;
                  }
                ) : (
                  // otherwise shows all the data
                  <DraggableContainer>
                    <ReactDataGrid
                      enableCellSelect={true}
                      enableCellSelection={true}
                      rowActionsCell={RowActionsCell}
                      columns={columns.slice(1)}
                      rowGetter={i => rows[i]}
                      rowsCount={rows.length}
                      // @ts-ignore
                      onGridRowsUpdated={onGridRowsUpdated}
                      toolbar={
                        <Toolbar enableFilter={true}>
                          {' '}
                          <button
                            className="btn"
                            onClick={() => {
                              setEdit(!edit);
                            }}
                          >
                            Toggle Edit Mode
                          </button>
                        </Toolbar>
                      }
                      rowRenderer={<RowRenderer onRowDrop={reorderRows} />}
                      rowSelection={{
                        showCheckbox: true,
                        enableShiftSelect: true,
                        onRowsSelected: onRowsSelected,
                        onRowsDeselected: onRowsDeselected,
                        selectBy: {
                          keys: {
                            rowKey: rowKey,
                            values: selectedIds
                          }
                        }
                      }}
                      getCellActions={getCellActions}
                      minHeight={750}
                    />
                  </DraggableContainer>
                )}
              </Card>
            </Col>
          );
        }
      } else {
        return <Redirect to={'/admin/tables'} />;
      }
    } else {
      return tables.names.map((table, key) => {
        return (
          <Col key={key} className="table-card-container mb-5" xs="12" sm="6" lg="3">
            <Card>
              <CardBody>
                <CardTitle className="text-uppercase font-weight-bold mb-0">{_.capitalize(table)}</CardTitle>{' '}
              </CardBody>
              <Link to={'/admin/tables/' + table}>
                <div id="img-container" className="w-100">
                  <img
                    width="100%"
                    height="100%"
                    alt="..."
                    className="bottom"
                    src={require('../../assets/img/compressed/' +
                      _.capitalize(table.charAt(0)) +
                      ' for ' +
                      _.capitalize(table) +
                      ' - white.jpg')}
                  />
                  <img
                    width="100%"
                    height="100%"
                    className="top"
                    alt="..."
                    src={require('../../assets/img/compressed/' +
                      _.capitalize(table.charAt(0)) +
                      ' for ' +
                      _.capitalize(table) +
                      ' - white fill.jpg')}
                  />
                </div>
              </Link>
            </Card>
          </Col>
        );
      });
    }
  };
  return (
    <div>
      {/*<Header />*/}
      <Header />
      {/* Page content */}
      <Container className="mt--9 mb-4" fluid>
        <Row>{renderTables()}</Row>
      </Container>
    </div>
  );
}

export default Tables;
