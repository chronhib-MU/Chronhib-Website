import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
// import logo from './logo.svg';
import './App.scss';
import _ from 'lodash';
import AdminLayout from './layouts/Admin.js';
import AuthLayout from './layouts/Auth.js';
import { tables, updateData } from './variables/tableData';

function App() {
  let dataTables = {
    text: [],
    sentences: [],
    lemmata: [],
    morphology: []
  };
  // useEffect(() => {
  //   // This makes sure one is finished before the next table is filled
  //   let isSubscribed = true;

  //   return () => (isSubscribed = false);
  // }, [dataTables]);
  const fetchData = async table => {
    //  If it's a table that exists and the table is empty
    if (Array.isArray(tables[table].data) && !tables[table].data.length) {
      const res = await fetch('http://localhost:4000/' + table);
      const json = await res.json();
      console.log(json);
      try {
        console.log('Appjs>useEffect>updateData', {
          ..._.zipObject(
            tables.names,
            tables.names.map(table => tables[table].data)
          ),
          [table]: json.data
        });
        // setDataTables({ ...data, [table]: json.data });
        dataTables = {
          ...dataTables,
          [table]: json.data
        };
        console.log('Appjs>useEffect>dataTables', dataTables);
        updateData({ ...dataTables, [table]: json.data });
      } catch (err) {
        console.error(err);
      }
      // console.log(table, data[table]);
    } else {
      // If the table doesn't exist
      if (!Array.isArray(tables[table].data)) {
        console.log(table + ' does not exist', tables[table].data);
      } else {
        // If the table is not empty
        console.log(table + ' is not empty');
      }
    }
  };
  // tables.forEach(table => fetchData(table));
  tables.names.forEach(table => fetchData(table));
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/admin" render={props => <AdminLayout {...props} />} />
          <Route path="/auth" render={props => <AuthLayout {...props} />} />
          <Redirect from="/" to="/admin/index" />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
