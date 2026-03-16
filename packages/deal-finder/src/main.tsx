import React from 'react';
import ReactDOM from 'react-dom/client';
import DealFinder from './components/DealFinder';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <DealFinder />
    </div>
  </React.StrictMode>,
);
