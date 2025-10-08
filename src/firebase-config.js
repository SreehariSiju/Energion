    // Import the functions you need from the SDKs you need
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";

    // --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
    const firebaseConfig = {
        apiKey: "AIzaSyBnlQycPbTi3KuqFot6wTFHKM7Kf8dRzOQ",
        authDomain: "energion-f5860.firebaseapp.com",
        projectId: "energion-f5860",
        storageBucket: "energion-f5860.appspot.com",
        messagingSenderId: "824641172299",
        appId: "1:824641172299:android:aff9b94e27fb537e8b2ece"
    };
    // ---------------------------------------------

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize and export Firebase services
    export const auth = getAuth(app);
    export const db = getFirestore(app);
    
