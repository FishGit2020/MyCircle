import React from 'react';
import ReactDOM from 'react-dom/client';
import TravelMap from './components/TravelMap';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <TravelMap />
    </div>
  </React.StrictMode>,
);
