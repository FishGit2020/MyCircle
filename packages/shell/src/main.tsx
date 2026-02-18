import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
import * as Sentry from '@sentry/react';
import { getApolloClient, I18nProvider, ToastProvider, reportWebVitals } from '@mycircle/shared';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import { ThemeSync, DataSync, ReloadPrompt, Onboarding } from './components/sync';
import { logEvent } from './lib/firebase';
import App from './App';
import './index.css';

Sentry.init({
  dsn: 'https://87fdd6cb3be74b2284019ac9fdce801e@o4510878995251200.ingest.us.sentry.io/4510878996299776',
  release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  // Only add trace headers to our own domains — never to Google OAuth or other third parties
  tracePropagationTargets: ['localhost', /^https:\/\/mycircle-dash\.web\.app/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: import.meta.env.PROD,
  // Ignore errors from Google OAuth popup flow to prevent interference
  denyUrls: [
    /accounts\.google\.com/,
    /apis\.google\.com/,
    /googleapis\.com/,
  ],
});

const client = getApolloClient();

// Report Core Web Vitals (LCP, CLS, INP, FCP, TTFB) to Google Analytics
reportWebVitals(logEvent);

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
