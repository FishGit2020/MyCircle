// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import DigitalLibrary from './components/DigitalLibrary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <DigitalLibrary />
    </div>
  </React.StrictMode>
);
