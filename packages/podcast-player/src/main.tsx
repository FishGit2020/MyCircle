// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import PodcastPlayer from './components/PodcastPlayer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PodcastPlayer />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
