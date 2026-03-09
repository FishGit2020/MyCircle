import React from 'react';
import ReactDOM from 'react-dom/client';
import RadioStation from './components/RadioStation';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <RadioStation />
    </div>
  </React.StrictMode>,
);
