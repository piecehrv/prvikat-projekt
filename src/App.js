import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { db } from './firebase'; 
import { ref, onValue } from "firebase/database";
import './App.css';

// UVOŽENJE KOMPONENTI
import Login from './Login';
import Admin from './Admin';
import UserDashboard from './userdashboard';

// --- SIGURNOSNA KOMPONENTA ZA OBIČNE KORISNIKE ---
const PrivateRoute = ({ children }) => {
  const isLogiran = localStorage.getItem("userLogiran") === "true";
  return isLogiran ? children : <Navigate to="/login" />;
};

// --- SIGURNOSNA KOMPONENTA SAMO ZA ADMINA ---
const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem("adminLogiran") === "true";
  return isAdmin ? children : <Navigate to="/login" />;
};

// --- LANDING PAGE KOMPONENTA ---
function LandingPage({ prolaznost, aktivniClanovi, obavijest }) {
  const recenzije = [
    { id: 1, user: "@Antonio_zg", tekst: "Otkad sam na Prvom Katu, profit mi je konstantan." },
    { id: 2, user: "@Ana32", tekst: "Najbolji omjer uloženog i dobivenog. Svaka preporuka!" },
    { id: 3, user: "@JosipEVO", tekst: "Sve pohvale za preciznost. Prvi Kat je klasa iznad svih." }
  ];

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <h2 className="logo-text">PRVI KAT</h2>
          <Link to="/login">
            <button className="login-btn">ČLANSKI ULAZ</button>
          </Link>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content">
          <span className="badge">OFFICIAL GROUP</span>
          <h1>PRVI KAT</h1>
          <p className="hero-subtitle">Vrhunske sportske analize bazirane na čistoj statistici.</p>
        </div>

        <div className="news-card">
          <img src={obavijest.slika || "https://via.placeholder.com/1000"} alt="Obavijest" className="news-img" />
          <div className="news-info">
            <span className="news-tag">NAJNOVIJA OBJAVA</span>
            <h3>{obavijest.naslov}</h3>
            <p>{obavijest.opis}</p>
          </div>
        </div>
      </header>

      <section className="stats-container">
        <div className="stats-wrapper">
          <div className="performance-box">
            <div className="circular-progress" style={{background: `conic-gradient(#d4af37 ${prolaznost * 3.6}deg, #222 0deg)`}}>
              <div className="inner-circle">
                <span className="percent-num">{prolaznost}%</span>
                <span className="percent-label">PROLAZ</span>
              </div>
            </div>
          </div>
          <div className="active-members-box">
            <h3 className="members-count">{aktivniClanovi}</h3>
            <p className="members-label">AKTIVNIH ČLANOVA</p>
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <h2 className="section-title">RECENZIJE</h2>
        <div className="reviews-grid">
          {recenzije.map((r) => (
            <div key={r.id} className="review-card">
              <p>"{r.tekst}"</p>
              <h4>{r.user}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* --- NOVA SEKCIJA: KAKO PRISTUPITI & KONTAKT --- */}
      <section className="access-section">
        <h2 className="section-title">KAKO POSTATI ČLAN?</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-num">1</div>
            <h4>Kontakt</h4>
            <p>Javite nam se putem Instagrama ili WhatsAppa za upit o slobodnim mjestima.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h4>Aktivacija</h4>
            <p>Nakon dogovora, admin kreira vaš korisnički profil u našem sustavu.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h4>Pristup</h4>
            <p>Prijavite se na "Članski ulaz" i pratite naše svakodnevne analize.</p>
          </div>
        </div>

        <div className="contact-buttons-container">
          <a href="https://instagram.com/prvi_kat" target="_blank" rel="noreferrer" className="contact-btn insta-btn">
            INSTAGRAM: @prvi_kat
          </a>
          <a href="https://wa.me/385919259043" target="_blank" rel="noreferrer" className="contact-btn wa-btn">
            WHATSAPP: 091 925 9043
          </a>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 PRVI KAT | Profesionalne Sportske Analize</p>
      </footer>
    </div>
  );
}

// --- GLAVNA APP KOMPONENTA ---
function App() {
  const [prolaznost, setProlaznost] = useState(0); 
  const [aktivniClanovi, setAktivniClanovi] = useState(0);
  const [obavijest, setObavijest] = useState({ naslov: "Učitavanje...", opis: "...", slika: "" });

  useEffect(() => {
    onValue(ref(db, 'podaci/stats'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProlaznost(data.prolaznost || 0);
        setAktivniClanovi(data.clanovi || 0);
      }
    });

    onValue(ref(db, 'podaci/obavijest'), (snapshot) => {
      const data = snapshot.val();
      if (data) setObavijest(data);
    });
  }, []);

  return (
    <Router>
      <Routes>
        {/* JAVNE RUTE */}
        <Route path="/" element={
          <LandingPage 
            prolaznost={prolaznost} 
            aktivniClanovi={aktivniClanovi} 
            obavijest={obavijest} 
          />
        } />
        
        <Route path="/login" element={<Login />} />

        {/* ADMIN RUTA - Zaštićena */}
        <Route path="/admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />
        
        {/* KORISNIČKI DASHBOARD - Zaštićen */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />

        {/* REDIRECT AKO STRANICA NE POSTOJI */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;