import React from 'react';
import './App.css';

function Dashboard() {
  // Ovo ćeš kasnije puniti preko Admin Panela
  const analize = [
    { id: 1, par: "Real Madrid - Barcelona", tip: "Oba daju gol (GG)", tecaj: "1.65", vrijeme: "21:00", status: "PENDING" },
    { id: 2, par: "Liverpool - Arsenal", tip: "Više od 2.5 gola", tecaj: "1.80", vrijeme: "18:30", status: "PENDING" }
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="logo-text">PRVI KAT</h2>
        <nav className="sidebar-nav">
          <button className="nav-item active">DANAŠNJE ANALIZE</button>
          <button className="nav-item">ARHIVA PROGNOZA</button>
          <button className="nav-item">UPLATNI LISTIĆI</button>
          <button className="nav-item logout">ODJAVA</button>
        </nav>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Dobrodošao natrag, Pobjedniče! 🏆</h1>
          <p>Evo što smo pripremili za tebe danas:</p>
        </header>

        <section className="analysis-grid">
          {analize.map(a => (
            <div key={a.id} className="analysis-card">
              <div className="card-header">
                <span className="time">{a.vrijeme}h</span>
                <span className="league">PREMIUM PICK</span>
              </div>
              <h2 className="match-title">{a.par}</h2>
              <div className="pick-box">
                <span className="pick-label">PROGNOZA:</span>
                <span className="pick-value">{a.tip}</span>
              </div>
              <div className="odds-box">
                <span className="odds-label">TEČAJ:</span>
                <span className="odds-value">{a.tecaj}</span>
              </div>
              <button className="details-btn">DETALJNA ANALIZA</button>
            </div>
          ))}
        </section>

        <section className="bankroll-notice">
          <h3>💡 SAVJET ZA ULOG</h3>
          <p>Danas preporučujemo umjeren ulog od <strong>3/10 unita</strong>. Fokus je na sigurnosti, ne na jurnjavi koeficijenata.</p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;