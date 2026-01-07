// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    messagingSenderId: "253398505008", // Hardcoded fallback for now, ideally matched with environment
    apiKey: "AIzaSyB7LrGyDeLg41PGhDVB_mQdwHeJbHT5V5A",
    projectId: "random-b5065",
    appId: "1:253398505008:web:c2844a317d5ebb7c43bff5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/placeholder.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
