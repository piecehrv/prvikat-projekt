import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { ref, onValue } from "firebase/database";
import { useNavigate } from 'react-router-dom'; 
import './App.css';

function UserDashboard() {
  const navigate = useNavigate();
  const [analiza, setAnaliza] = useState(null);
  const [povijest, setPovijest] = useState([]);
  const [arhiva, setArhiva] = useState({}); // NOVO
  const [prikazanaArhiva, setPrikazanaArhiva] = useState(null); // Koji mjesec iz arhive gledamo
  const [poruka, setPoruka] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preostaloDana, setPreostaloDana] = useState(null);

  useEffect(() => {
    const isLogiran = localStorage.getItem("userLogiran") || localStorage.getItem("adminLogiran");
    const emailLogiranog = localStorage.getItem("userEmail");

    if (!isLogiran) {
      navigate('/login');
      return;
    }

    if (emailLogiranog) {
      const userKey = emailLogiranog.replace(/\./g, '_');
      onValue(ref(db, `korisnici/${userKey}`), (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.istek) {
          const razlika = Math.ceil((new Date(userData.istek) - new Date()) / (1000 * 60 * 60 * 24));
          setPreostaloDana(razlika > 0 ? razlika : 0);
        }
      });
    }

    onValue(ref(db, 'podaci/porukaClanovima'), (snapshot) => {
      setPoruka(snapshot.val());
    });

    onValue(ref(db, 'podaci/analiza'), (snapshot) => {
      setAnaliza(snapshot.val());
      setLoading(false);
    });

    // Slušamo trenutnu povijest (ono što nije arhivirano)
    onValue(ref(db, 'podaci/povijest'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setPovijest(lista.reverse());
      } else {
        setPovijest([]);
      }
    });

    // Slušamo arhivu (ono što je Admin spremio kao prošle mjesece)
    onValue(ref(db, 'podaci/arhiva'), (snapshot) => {
      if (snapshot.exists()) {
        setArhiva(snapshot.val());
      }
    });
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Računanje profita za TRENUTNI mjesec (samo ono što je u povijesti)
  const trenutniProfit = povijest.reduce((acc, t) => {
    if (t.status === 'win') return acc + (t.ulog * (t.tecaj - 1));
    if (t.status === 'loss') return acc - t.ulog;
    return acc;
  }, 0);

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-container">
          <h2 className="logo-text">PRVI KAT</h2>
          <button className="login-btn" onClick={logout}>ODJAVA</button>
        </div>
      </nav>

      <div className="dashboard-content">
        
        {/* TRENUTNI PROFIT KRUG */}
        <section className="bankroll-section">
          <div className="profit-card">
            <h4>TRENUTNI PROFIT</h4>
            <h2 className={trenutniProfit >= 0 ? "profit-positive" : "profit-negative"}>
              {trenutniProfit >= 0 ? `+${trenutniProfit.toFixed(2)}%` : `${trenutniProfit.toFixed(2)}%`}
            </h2>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ 
                    width: `${Math.min(Math.max(50 + trenutniProfit, 5), 100)}%`,
                    backgroundColor: trenutniProfit >= 0 ? '#d4af37' : '#ff4d4d'
                }}
              ></div>
            </div>
            <p className="small-text">Ovaj mjesec u tijeku</p>
          </div>
        </section>

        <header className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <h1>Dobrodošao natrag! 👋</h1>
          {preostaloDana !== null && (
            <div className="days-left-badge">
              ČLANSTVO: <span>{preostaloDana} DANA</span>
            </div>
          )}
        </header>

        {poruka && (
          <div className="private-message-box">
            <div className="msg-header">
              <span>🔔 OBAVIJEST ADMINA</span>
              <small>{poruka.vrijeme}</small>
            </div>
            <p>{poruka.tekst}</p>
          </div>
        )}

        <div className="analysis-wrapper">
          {loading ? (
            <div className="loading-box">Učitavanje podataka...</div>
          ) : analiza && analiza.status === 'pending' ? (
            <div className="premium-card">
              <div className="card-header">
                <span className="live-badge">AKTIVNA ANALIZA</span>
                <span className="timestamp">{analiza.datum} | {analiza.vrijeme}h</span>
              </div>
              <div className="match-details">
                <h2 className="match-title">{analiza.par}</h2>
              </div>
              <div className="stats-row">
                <div className="stat-box">
                  <span className="label">TIP</span>
                  <span className="value gold-text">{analiza.tip}</span>
                </div>
                <div className="stat-box">
                  <span className="label">TEČAJ</span>
                  <span className="value">{analiza.tecaj}</span>
                </div>
                <div className="stat-box">
                  <span className="label">ULOG</span>
                  <span className="value">{analiza.ulog}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Trenutno nema aktivne analize. Čekamo Admina... ⏳</p>
            </div>
          )}
        </div>

        {/* POVIJEST TRENUTNOG MJESECA */}
        <section className="history-section">
          <h3>📜 Trenutna povijest</h3>
          <div className="history-list">
            {povijest.length > 0 ? povijest.map((item, index) => (
              <div key={index} className={`history-item ${item.status}`}>
                <div className="history-main">
                  <small style={{color: '#888'}}>{item.datum}</small><br/>
                  <strong>{item.par}</strong>
                  <span>{item.tip} (@{item.tecaj})</span>
                </div>
                <div className="history-result">
                  {item.status === 'win' ? (
                    <span className="win-text">✅ +{(item.ulog * (item.tecaj - 1)).toFixed(1)}%</span>
                  ) : item.status === 'loss' ? (
                    <span className="loss-text">❌ -{item.ulog}%</span>
                  ) : (
                    <span className="pending-text">⏳ Čeka se</span>
                  )}
                </div>
              </div>
            )) : <p>Još nema završenih analiza u ovom mjesecu.</p>}
          </div>
        </section>

        {/* --- NOVO: ARHIVA PROŠLIH MJESECI --- */}
        <section className="archive-section" style={{ marginTop: '40px', borderTop: '1px solid #333', paddingTop: '20px' }}>
          <h3 style={{ color: '#d4af37' }}>📂 Arhiva prošlih mjeseci</h3>
          <div className="archive-nav" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '15px 0' }}>
            {Object.keys(arhiva).length > 0 ? Object.keys(arhiva).map(ime => (
              <button 
                key={ime} 
                onClick={() => setPrikazanaArhiva(prikazanaArhiva === ime ? null : ime)}
                style={{
                  padding: '8px 15px',
                  borderRadius: '5px',
                  border: '1px solid #d4af37',
                  background: prikazanaArhiva === ime ? '#d4af37' : 'transparent',
                  color: prikazanaArhiva === ime ? '#000' : '#d4af37',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {ime} {prikazanaArhiva === ime ? '▲' : '▼'}
              </button>
            )) : <p style={{fontSize: '0.8rem', color: '#666'}}>Nema arhiviranih mjeseci.</p>}
          </div>

          {prikazanaArhiva && arhiva[prikazanaArhiva] && (
            <div className="archive-details" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
              <h4 style={{marginBottom: '10px'}}>Rezultati: {prikazanaArhiva}</h4>
              {Object.values(arhiva[prikazanaArhiva]).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #222', fontSize: '0.85rem' }}>
                  <span>{item.datum} | <strong>{item.par}</strong></span>
                  <span className={item.status === 'win' ? 'win-text' : 'loss-text'}>
                    {item.status === 'win' ? '✅ WIN' : '❌ LOSS'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default UserDashboard;