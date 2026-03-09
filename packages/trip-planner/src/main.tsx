import React from 'react';
import ReactDOM from 'react-dom/client';
import TripPlanner from './components/TripPlanner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <TripPlanner />
    </div>
  </React.StrictMode>,
);
