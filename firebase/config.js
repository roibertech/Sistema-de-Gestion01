// Configuración de Firebase (usando compat)
const firebaseConfig = {
  apiKey: "AIzaSyDKadPfGUaEi3cdzPt9ODpiiBkB4JhfEgE",
  authDomain: "gestion-0-1.firebaseapp.com",
  projectId: "gestion-0-1",
  storageBucket: "gestion-0-1.firebasestorage.app",
  messagingSenderId: "507411766033",
  appId: "1:507411766033:web:d538dddacafdbac40d4ab0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore y exponerlo como variable global
const db = firebase.firestore();