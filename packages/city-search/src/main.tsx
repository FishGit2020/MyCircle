// Standalone entry point for development
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import { getApolloClient } from '@weather/shared';
import CitySearch from './components/CitySearch';
import './index.css';

const client = getApolloClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">City Search (Standalone)</h1>
          <CitySearch />
        </div>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);
