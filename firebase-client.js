import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';

const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'VOTRE_API_KEY' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'VOTRE_PROJECT_ID' &&
  firebaseConfig.appId &&
  firebaseConfig.appId !== 'VOTRE_APP_ID'
);

const app = firebaseReady ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const functions = app ? getFunctions(app) : null;

export { app, auth, db, firebaseReady, functions };
