import React from 'react';
import ReactDOM from 'react-dom/client';
import ImmigrationTracker from './components/ImmigrationTracker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <ImmigrationTracker />
    </div>
  </React.StrictMode>
);
