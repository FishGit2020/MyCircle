import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import * as Sentry from '@sentry/react';
import { getApolloClient, I18nProvider, ToastProvider, reportWebVitals } from '@mycircle/shared';
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
Sentry.init({
  dsn: 'https://87fdd6cb3be74b2284019ac9fdce801e@o4510878995251200.ingest.us.sentry.io/4510878996299776',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^https:\/\/mycircle-dash\.web\.app/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const client = getApolloClient();

// Report Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
reportWebVitals();

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
