// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import WorshipSongs from './components/WorshipSongs';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <WorshipSongs />
    </div>
  </React.StrictMode>
);
