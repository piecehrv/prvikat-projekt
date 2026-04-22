import React, { useState } from 'react';
import { db } from './firebase'; 
import { ref, onValue } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import './App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Pretvaramo email u ključ (mijenjamo točku u podvlaku)
    const userKey = email.replace(/\./g, '_');
    const userRef = ref(db, `korisnici/${userKey}`);

    // 2. Provjera u Firebaseu
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();

      if (userData && userData.password === password) {
        // PRIJAVA USPJEŠNA - Spremamo podatke u memoriju preglednika
        localStorage.setItem("userLogiran", "true");
        localStorage.setItem("userEmail", email);

        // --- TVOJ ADMIN EMAIL ---
        const mojAdminEmail = "karlo.creatoradmin@gprvi.kat"; 

        if (email.toLowerCase() === mojAdminEmail.toLowerCase()) {
          // Ovdje postavljamo ključeve koje će Admin.js provjeravati
          localStorage.setItem("adminLogiran", "true"); 
          localStorage.setItem("isAdmin", "true");
          
          alert("Dobrodošao natrag, Admin!");
          navigate('/admin');
        } else {
          // Ako nije admin, brišemo admin ključ za svaki slučaj
          localStorage.removeItem("adminLogiran");
          localStorage.setItem("isAdmin", "false");
          
          alert("Uspješna prijava!");
          navigate('/dashboard');
        }
      } else {
        // PODACI NETOČNI
        alert("Pogrešan email ili lozinka, ili nemate aktivnu pretplatu!");
      }
    }, { onlyOnce: true });
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2 className="logo-text">PRVI KAT</h2>
        <p>Članski pristup analizama</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email adresa</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="unesite@email.com" 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Lozinka</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Unesite lozinku" 
              required 
            />
          </div>
          
          <button type="submit" className="login-submit-btn">PRIJAVI SE</button>
        </form>
        
        <p className="login-footer">Nemate pristup? Javi se adminu za aktivaciju.</p>
      </div>
    </div>
  );
}

export default Login;