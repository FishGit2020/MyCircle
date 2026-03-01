// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import ModelBenchmark from './components/ModelBenchmark';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8">
      <ModelBenchmark />
    </div>
  </React.StrictMode>
);
