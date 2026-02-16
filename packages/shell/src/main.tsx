import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ApolloProvider } from '@apollo/client/react';
// import * as Sentry from '@sentry/react'; // disabled — separate PR to investigate
import { getApolloClient, I18nProvider, ToastProvider, reportWebVitals } from '@mycircle/shared';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import { ThemeSync, DataSync, ReloadPrompt, Onboarding } from './components/sync';
import App from './App';
import './index.css';

// Sentry disabled — will re-enable in a dedicated PR to investigate compatibility with Google OAuth popup flow
// const SENTRY_DSN = 'https://87fdd6cb3be74b2284019ac9fdce801e@o4510878995251200.ingest.us.sentry.io/4510878996299776';
//
// Sentry.init({
//   dsn: SENTRY_DSN,
//   integrations: [
//     Sentry.browserTracingIntegration(),
//     Sentry.replayIntegration(),
//   ],
//   sendDefaultPii: true,
//   tracesSampleRate: 1.0,
//   tracePropagationTargets: ['localhost', /^https:\/\/mycircle-dash\.web\.app/],
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
//   enabled: import.meta.env.PROD,
// });

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
