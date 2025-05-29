'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyCCO1d5aIeWmOlgK9C2PA3Nx_LR_mo1NbY",
  authDomain: "abdc-828da.firebaseapp.com",
  projectId: "abdc-828da",
  storageBucket: "abdc-828da.firebasestorage.app",
  messagingSenderId: "408357211998",
  appId: "1:408357211998:web:5dcc2628bbc1bb0814c9cf"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };