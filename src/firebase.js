import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBk7y7h53W2DAEzc69i4VkFcUETlhdoaWY",
  authDomain: "prvi-kat.firebaseapp.com",
  // OVO JE KLJUČNA LINIJA KOJA RJEŠAVA GREŠKU SA SLIKE:
  databaseURL: "https://prvi-kat-default-rtdb.europe-west1.firebasedatabase.app", 
  projectId: "prvi-kat",
  storageBucket: "prvi-kat.firebasestorage.app",
  messagingSenderId: "811289161688",
  appId: "1:811289161688:web:94f8a72bcf9a5bfc3c4cad",
  measurementId: "G-66QRFRDJKZ"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);