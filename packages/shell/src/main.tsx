import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import { getApolloClient, I18nProvider } from '@weather/shared';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import ThemeSync from './components/ThemeSync';
import App from './App';
import './index.css';

const client = getApolloClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <RemoteConfigProvider>
            <ThemeSync />
            <ApolloProvider client={client}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ApolloProvider>
          </RemoteConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </React.StrictMode>
);
