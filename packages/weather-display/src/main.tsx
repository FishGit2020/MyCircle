// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import { getApolloClient } from '@mycircle/shared';
import WeatherDisplay from './components/WeatherDisplay';

const client = getApolloClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Weather Display (Standalone)</h1>
          <Routes>
            <Route path="/weather/:coords" element={<WeatherDisplay />} />
            <Route path="*" element={
              <p className="text-gray-500">
                Navigate to /weather/51.5073,-0.1276?name=London to see weather
              </p>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);
