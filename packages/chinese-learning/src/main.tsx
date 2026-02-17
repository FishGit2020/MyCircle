// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import ChineseLearning from './components/ChineseLearning';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <ChineseLearning />
    </div>
  </React.StrictMode>
);
