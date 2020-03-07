/*!

=========================================================
* Argon Dashboard React - v1.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

// reactstrap components
import {
  Card,
  Container,
  Row,
  CardBody,
  CardTitle,
  Col,
  CardHeader,
  Table,
  CardFooter,
  Pagination,
  PaginationItem,
  PaginationLink
} from 'reactstrap';
// core components
import Header from '../../components/Headers/Header.js';
import './Tables.scss';
import _ from 'lodash';
import { Redirect } from 'react-router-dom';
import { tables, tableBodies, tableHeaders } from '../../variables/tableData';
import { data } from '../../App.js';
function useQuery() {
  return new URLSearchParams(useLocation().search);
}
function Tables(props) {
  let { table, id } = useParams();
  console.log(table);
  // let currentPage = useQuery().get('page') || '1';
  // console.log(currentPage);
  // let params = useParams();
  // console.log(params);
  const renderTables = () => {
    if (table && id) {
      console.log(table, id);
    } else if (table) {
      if (tables.includes(table)) {
        return (
          <div>
            <Container className="mt--7" fluid>
              {/* Table */}
              <Row>
                <div className="col">
                  <Card className="shadow">
                    <CardHeader className="border-0">
                      <h2 className="mb-0">{_.capitalize(table)}</h2>
                    </CardHeader>
                    <Table className="align-items-center table-flush" responsive hover>
                      <thead className="thead-light">
                        <tr>
                          {tableHeaders[table + 'Headers'].map((header, i) => {
                            return (
                              <th key={i} scope="col">
                                {header}
                              </th>
                            );
                          })}
                          <th scope="col" />
                        </tr>
                      </thead>
                      <tbody>
                        {data[table].map((rows, i) => {
                          return (
                            <tr key={i}>
                              {tableBodies[table + 'Bodies'].map((column, i) => {
                                return <td key={i}>{rows[column]}</td>;
                              })}
                              <td />
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    <CardFooter className="py-4">
                      <nav aria-label="...">
                        <Pagination
                          className="pagination justify-content-end mb-0"
                          listClassName="justify-content-end mb-0"
                        >
                          <PaginationItem className="disabled">
                            <PaginationLink href="#pablo" onClick={e => e.preventDefault()} tabIndex="-1">
                              <i className="fas fa-angle-left" />
                              <span className="sr-only">Previous</span>
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem className="active">
                            <PaginationLink href="#pablo" onClick={e => e.preventDefault()}>
                              1
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#pablo" onClick={e => e.preventDefault()}>
                              2 <span className="sr-only">(current)</span>
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#pablo" onClick={e => e.preventDefault()}>
                              3
                            </PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#pablo" onClick={e => e.preventDefault()}>
                              <i className="fas fa-angle-right" />
                              <span className="sr-only">Next</span>
                            </PaginationLink>
                          </PaginationItem>
                        </Pagination>
                      </nav>
                    </CardFooter>
                  </Card>
                </div>
              </Row>
            </Container>
          </div>
        );
      } else {
        return <Redirect to={'/admin/tables'} />;
      }
    } else {
      return tables.map((table, key) => {
        return (
          <Col key={key} className="mb-4">
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
                    src={require('../../assets/img/' +
                      _.capitalize(table.charAt(0)) +
                      ' for ' +
                      _.capitalize(table) +
                      '.png')}
                  />
                  <img
                    width="100%"
                    height="100%"
                    className="top"
                    alt="..."
                    src={require('../../assets/img/' +
                      _.capitalize(table.charAt(0)) +
                      ' for ' +
                      _.capitalize(table) +
                      ' - fill.png')}
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
      <Header />
      {/* Page content */}
      <Container fluid>
        <Row>{renderTables()}</Row>
      </Container>
    </div>
  );
}

export default Tables;
