import React from 'react';
import ReactDOM from 'react-dom/client';
import AiInterviewer from './components/AiInterviewer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <AiInterviewer />
    </div>
  </React.StrictMode>,
);
