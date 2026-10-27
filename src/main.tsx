import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// CSS Design System Tokens & Liquid Glass
import './styles/global.css';
import './styles/liquid-glass.css';
import './styles/layout.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
