import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase com valores padrão
// Você deve atualizar essas credenciais com as do seu projeto Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForEquipmentControl",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "equipment-control-4a286.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "equipment-control-4a286",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "equipment-control-4a286.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

export default app;
