// js/services/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    addDoc, 
    collection,
    query,
    where,
    orderBy, 
    onSnapshot,
    runTransaction,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBgX9tL8zEaPvaZIcqDdk8XHzz4y7MvCeU",
    authDomain: "salesonwheels-f6eec.firebaseapp.com",
    projectId: "salesonwheels-f6eec",
    storageBucket: "salesonwheels-f6eec.firebasestorage.app",
    messagingSenderId: "432785821226",
    appId: "1:432785821226:web:96b34cc3d0526160b0bd53"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { 
    auth, 
    db, 
    provider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    runTransaction,
    serverTimestamp
};