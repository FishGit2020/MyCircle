// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import FlashCards from './components/FlashCards';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <FlashCards />
    </div>
  </React.StrictMode>
);
