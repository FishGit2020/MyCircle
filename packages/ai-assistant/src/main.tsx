// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import AiAssistant from './components/AiAssistant';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <AiAssistant />
    </div>
  </React.StrictMode>
);
