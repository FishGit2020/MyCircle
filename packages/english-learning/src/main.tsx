// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import EnglishLearning from './components/EnglishLearning';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <EnglishLearning />
    </div>
  </React.StrictMode>
);
