// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import WebCrawler from './components/WebCrawler';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <WebCrawler />
    </div>
  </React.StrictMode>
);
