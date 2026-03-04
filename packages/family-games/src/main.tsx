// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import FamilyGames from './components/FamilyGames';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <FamilyGames />
    </div>
  </React.StrictMode>
);
