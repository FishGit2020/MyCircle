import React from 'react';
import ReactDOM from 'react-dom/client';
import Setup from './components/Setup';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <Setup />
    </div>
  </React.StrictMode>
);
