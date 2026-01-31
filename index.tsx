
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Correção para o erro "process is not defined" em ambientes de produção (GitHub Pages/Netlify)
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = {
    env: {
      API_KEY: ''
    }
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
