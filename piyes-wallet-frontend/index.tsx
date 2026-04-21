
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';

console.log("index.tsx: Starting mount...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("index.tsx: Could not find root element");
  throw new Error("Could not find root element to mount to");
}

console.log("index.tsx: Creating root...");
const root = ReactDOM.createRoot(rootElement);
console.log("index.tsx: Rendering App...");
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
console.log("index.tsx: Render called.");
