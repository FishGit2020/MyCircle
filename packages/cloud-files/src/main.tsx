// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import CloudFiles from './components/CloudFiles';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <CloudFiles />
    </div>
  </React.StrictMode>
);
