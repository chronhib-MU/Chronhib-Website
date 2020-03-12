import React, { useContext, useState } from 'react';
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
import { tables, DataTableContext, tableBodies, tableHeaders } from '../../variables/tableData';

import _ from 'lodash';
const {
  Draggable: { Container: DraggableContainer, RowActionsCell, DropTargetRowContainer }
} = require('react-data-grid-addons');
const RowRenderer = DropTargetRowContainer(ReactDataGrid.Row);

const selectors = Data.Selectors;
const getRows = (rows, filters) => selectors.getRows({ rows, filters });

function useQuery() {
  return new URLSearchParams(useLocation().search);
}
// Tables.propTypes = {
//   rowKey: PropTypes.string.isRequired
// };

// Tables.defaultProps = { rowKey: 'id' };
function Tables(props) {
  const [dataTables, setDataTables] = useContext(DataTableContext);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [rowKey, setRowKey] = useState('ID_unique_number');
  // let rowKey = 'ID_unique_number';
  // const [filteredRows, setFilteredRows] = useState([]);
  let { table, id } = useParams();
  let filteredRows = [];
  // console.log(table);
  let currentPage = parseInt(useQuery().get('page'), 10) || 1;

  const renderTables = () => {
    if (table) {
      // check if theres a table parameter
      if (tables.includes(table)) {
        // checks that its a valid table
        // console.log('rowKey:', rowKey);
        let mode = 'edit';
        let columns = _.zip(tableBodies[table + 'Bodies'], tableHeaders[table + 'Headers']).map(header => {
          const res = {
            key: header[0],
            name: header[1],
            editable: _.eq(mode, 'edit') ? true : false,
            resizable: true,
            filterable: true
          };
          // console.table(res);
          return res;
        });

        const columnKeys = columns.map(column => column.key);
        let rows = dataTables[table].map(row =>
          _.zipObject(
            columnKeys,
            columnKeys.map(columnKey => row[columnKey])
          )
        );
        // console.log('rowsjkhui', rows);
        filteredRows = getRows(rows, filters);
        const onGridRowsUpdated = ({ fromRow, toRow, updated, fromRowData }) => {
          // updates the grid rows
          let newRows = _.slice(filteredRows, fromRow, toRow + 1); // the rows to be changed
          let loc = _.findIndex(dataTables[table], fromRowData);
          // console.log('*************');
          // console.log('fromRow', fromRow);
          // console.log('toRow', toRow);
          console.table(newRows);
          console.log('updated', updated);
          console.log('fromRowData', fromRowData);
          console.log(dataTables[table][loc]);
          newRows.forEach(newRow => {
            loc = _.findIndex(dataTables[table], newRow);
            let newDataRow = _.mergeWith(dataTables[table][loc], updated, (objValue, srcValue) => {
              if (_.isArray(objValue)) {
                return srcValue;
              }
            });
            setDataTables({ ...dataTables, [table + '.' + loc]: newDataRow });
          });
          // console.log(dataTables[table][loc]);
          // console.log('tables', dataTables[table]);
          // console.log('*************');
        };

        const handleFilterChange = filter => filters => {
          // handles the filters changing
          const newFilters = { ...filters };
          if (filter.filterTerm) {
            newFilters[filter.column.key] = filter;
          } else {
            delete newFilters[filter.column.key];
          }
          return newFilters;
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
            rows: filteredRows
          });
          let draggedRows = isDraggedRowSelected(selectedRows, e.rowSource) ? selectedRows : [e.rowSource.data];
          let undraggedRows = filteredRows.filter(r => draggedRows.indexOf(r) === -1);
          let args = [e.rowTarget.idx, 0].concat(draggedRows);
          console.log('args', args);
          Array.prototype.splice.apply(undraggedRows, args);
          filteredRows = getRows(undraggedRows, filters);
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
        // console.log('columns', columns);
        // console.log('filteredRows', filteredRows);

        return (
          <Col>
            <Card className="shadow">
              {/* Table Header */}
              <CardHeader className="border-0">
                <h2 className="mb-0">{_.capitalize(table)}</h2>
              </CardHeader>
              {/* Table Body */}
              {id ? (
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
                    columns={columns}
                    rowGetter={i => filteredRows[i]}
                    rowsCount={filteredRows.length}
                    onGridRowsUpdated={onGridRowsUpdated}
                    toolbar={<Toolbar enableFilter={true} />}
                    onAddFilter={filter => setFilters(handleFilterChange(filter))}
                    onClearFilters={() => setFilters({})}
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
                    minHeight={750}
                  />
                </DraggableContainer>
              )}
            </Card>
          </Col>
        );
      } else {
        return <Redirect to={'/admin/tables'} />;
      }
    } else {
      return tables.map((table, key) => {
        return (
          <Col key={key} className="table-card-container mb-4" xs="12" sm="6" lg="3">
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
                    src={require('../../assets/img/icons/common/' +
                      _.capitalize(table.charAt(0)) +
                      ' for ' +
                      _.capitalize(table) +
                      '.svg')}
                  />
                  <img
                    width="100%"
                    height="100%"
                    className="top"
                    alt="..."
                    src={require('../../assets/img/icons/common/' +
                      _.capitalize(table.charAt(0)) +
                      ' for ' +
                      _.capitalize(table) +
                      ' - fill.svg')}
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
      <Container className="mt--9 mb-3" fluid>
        <Row>{renderTables()}</Row>
      </Container>
    </div>
  );
}

export default Tables;
