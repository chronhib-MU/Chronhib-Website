import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
// import logo from './logo.svg';
import './App.scss';

import AdminLayout from './layouts/Admin.js';
import AuthLayout from './layouts/Auth.js';
import { tables } from './variables/tableData';

export let data = {
  text: [],
  sentences: [],
  morphology: [],
  lemmata: []
};
function App() {
  useEffect(() => {
    const fetchData = async table => {
      if (tables.includes(table)) {
        const res = await fetch('http://localhost:4000/' + table);
        const json = await res.json();
        // @ts-ignore
        // console.table(json);
        try {
          data = { ...data, [table]: json.data };
        } catch (err) {
          console.error(err);
        }
        console.log(data);
      }
    };
    tables.map(table => fetchData(table));
    return () => data;
  }, []);
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
