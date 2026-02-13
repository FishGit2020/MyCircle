import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import * as Sentry from '@sentry/react';
import { getApolloClient, I18nProvider, ToastProvider } from '@mycircle/shared';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import ThemeSync from './components/ThemeSync';
import DataSync from './components/DataSync';
import App from './App';
import ReloadPrompt from './components/ReloadPrompt';
import Onboarding from './components/Onboarding';
import './index.css';

// Initialize Sentry before rendering
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/mycircle-app\.web\.app/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: import.meta.env.PROD,
  });
}

const client = getApolloClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <RemoteConfigProvider>
            <ToastProvider>
              <ThemeSync />
              <DataSync />
              <ApolloProvider client={client}>
                <BrowserRouter>
                  <App />
                  <Onboarding />
                </BrowserRouter>
                <ReloadPrompt />
              </ApolloProvider>
            </ToastProvider>
          </RemoteConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </React.StrictMode>
);
