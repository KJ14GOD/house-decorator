// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB61ZzYOKkl_IIFzhvigsWfxZ2Z6o1b-VU",
  authDomain: "decorator-ai-866c5.firebaseapp.com",
  projectId: "decorator-ai-866c5",
  storageBucket: "decorator-ai-866c5.firebasestorage.app",
  messagingSenderId: "327852870810",
  appId: "1:327852870810:web:5e3b9ba0649281ace86323",
  measurementId: "G-BL949RWHQZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };