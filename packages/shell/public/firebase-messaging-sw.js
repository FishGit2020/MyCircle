/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker
// Uses compat SDK via importScripts (ES modules not supported in service workers)
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');

// These values are public (same as in the client bundle)
firebase.initializeApp({
  apiKey: 'AIzaSyDeUSQG1CKbAC-_8iGKF4nETF9p-JWPQps',
  authDomain: 'mycircle-dash.firebaseapp.com',
  projectId: 'mycircle-dash',
  storageBucket: 'mycircle-dash.firebasestorage.app',
  messagingSenderId: '84705111364',
  appId: '1:84705111364:web:eebe49a0481f3642f13b11',
});

const messaging = firebase.messaging();

// Handle background messages (when the app is not in the foreground)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Weather Alert', {
    body: body || 'You have a new weather notification.',
    icon: icon || '/favicon.ico',
  });
});
