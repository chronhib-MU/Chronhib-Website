import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
// import logo from './logo.svg';
import './App.scss';

import AdminLayout from './layouts/Admin.js';
import AuthLayout from './layouts/Auth.js';
import { tables, updateData, data, DataTableContext } from './variables/tableData';

function App() {
  const [dataTables, setDataTables] = useState({
    text: [],
    sentences: [],
    lemmata: [],
    morphology: []
  });
  useEffect(() => {
    let isSubscribed = true;
    const fetchData = async table => {
      if (Array.isArray(data[table]) && !data[table].length) {
        const res = await fetch('http://localhost:4000/' + table);
        const json = await res.json();
        // @ts-ignore
        // console.table(json);
        if (isSubscribed) {
          try {
            // console.log('updateData', { ...data, [table]: json.data });
            setDataTables({ ...data, [table]: json.data });
            updateData({ ...data, [table]: json.data });
          } catch (err) {
            console.error(err);
          }
        }
        // console.log(table, data[table]);
      } else {
        if (!Array.isArray(data[table])) {
          // console.log(table + ' does not exist', data[table]);
        } else {
          // console.log(table + ' is not empty');
        }
      }
    };
    tables.forEach(table => fetchData(table));
    return () => (isSubscribed = false);
  });
  return (
    <DataTableContext.Provider value={[dataTables, setDataTables]}>
      <div className="App">
        <Router>
          <Switch>
            <Route path="/admin" render={props => <AdminLayout {...props} />} />
            <Route path="/auth" render={props => <AuthLayout {...props} />} />
            <Redirect from="/" to="/admin/index" />
          </Switch>
        </Router>
      </div>
    </DataTableContext.Provider>
  );
}

export default App;
