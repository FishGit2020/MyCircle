// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import StockTracker from './components/StockTracker';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <StockTracker />
    </div>
  </React.StrictMode>
);
