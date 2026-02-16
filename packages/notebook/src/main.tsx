// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import Notebook from './components/Notebook';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <Notebook />
    </div>
  </React.StrictMode>
);
