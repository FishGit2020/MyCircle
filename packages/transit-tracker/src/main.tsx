import React from 'react';
import ReactDOM from 'react-dom/client';
import TransitTracker from './components/TransitTracker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <TransitTracker />
    </div>
  </React.StrictMode>,
);
