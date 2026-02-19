// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import WorkTracker from './components/WorkTracker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <WorkTracker />
    </div>
  </React.StrictMode>
);
