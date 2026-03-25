import React from 'react';
import ReactDOM from 'react-dom/client';
import ResumeTailor from './components/ResumeTailor';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <ResumeTailor />
    </div>
  </React.StrictMode>
);
