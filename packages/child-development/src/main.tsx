// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import ChildDevelopment from './components/ChildDevelopment';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <ChildDevelopment />
    </div>
  </React.StrictMode>
);
