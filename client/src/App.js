import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.scss';

function App() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/texts')
      .then(response => response.json())
      .then(({ data }) => {
        setTexts(data);
        console.log(data);
      })
      .catch(err => console.error(err));
  });
  const renderTexts = ({ ID_unique_number: id, Title_of_text: name }) => <div key={id}>{name}</div>;
  return <div className="App">{texts.map(renderTexts)}</div>;
}

export default App;
