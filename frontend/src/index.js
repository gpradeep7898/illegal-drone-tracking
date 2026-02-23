import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './styles/globals.css';
import './styles/animations.css';
import App from './components/App';
import process from 'process';
window.process = process;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
