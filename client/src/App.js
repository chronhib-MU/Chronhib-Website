import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import logo from './logo.svg';
import './App.scss';

import './assets/plugins/nucleo/css/nucleo.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/scss/argon-dashboard-react.scss';

import AdminLayout from './layouts/Admin.js';
import AuthLayout from './layouts/Auth.js';

function App() {
  const [text, setText] = useState([]);
  const [lemmata, setLemmata] = useState([]);
  const [morphology, setMorphology] = useState([]);
  const [sentences, setSentences] = useState([]);

  async function fetchData(path) {
    const res = await fetch('http://localhost:4000/' + path);
    res
      .json()
      .then(({ data }) => {
        if ('text' === path) {
          setText(data);
        } else if ('lemmata' === path) {
          setLemmata(data);
        } else if ('morphology' === path) {
          setMorphology(data);
        } else if ('sentences' === path) {
          setSentences(data);
        } else {
          throw Object.assign(new Error('Table not in Database'), { code: 404 });
        }
        console.log(data);
      })
      .catch(err => console.error(err));
  }
  useEffect(() => {
    ['text', 'lemmata', 'morphology', 'sentences'].forEach(table => fetchData(table));
  }, []);

  const renderLemmata = ({ ID_unique_number: id, Meaning: meaning }) => {
    return (
      <div key={id}>
        {id}: {meaning},
      </div>
    );
  };
  const renderMorphology = ({ ID_unique_number: id, Morph: morph }) => {
    return (
      <div key={id}>
        {id}: {morph}
      </div>
    );
  };
  const renderSentences = ({ ID_unique_number: id, Textual_Unit: TU }) => {
    return (
      <div key={id}>
        {id}: {TU}
      </div>
    );
  };
  const renderText = ({ ID_unique_number: id, Title_of_Text: ToT }) => {
    return (
      <div key={id}>
        {id}: {ToT}
      </div>
    );
  };
  // <div className="morphology">Morphology: {morphology.map(renderMorphology)}</div>
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/admin" render={props => <AdminLayout {...props} />} />
          <Route path="/auth" render={props => <AuthLayout {...props} />} />
          <Redirect from="/" to="/admin/index" />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
