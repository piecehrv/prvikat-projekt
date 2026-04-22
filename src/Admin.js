import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { ref, set, push, onValue, update, remove, get } from "firebase/database"; 
import { useNavigate } from 'react-router-dom'; // DODANO
import './App.css';

function Admin() {
  const navigate = useNavigate(); // DODANO

  // 1. STANJA
  const [prolaznost, setProlaznost] = useState('');
  const [clanovi, setClanovi] = useState('');
  const [naslov, setNaslov] = useState('');
  const [opis, setOpis] = useState('');
  const [slika, setSlika] = useState('');

  const [par, setPar] = useState('');
  const [vrijeme, setVrijeme] = useState('');
  const [datumUtakmice, setDatumUtakmice] = useState(''); 
  const [tip, setTip] = useState('');
  const [tecaj, setTecaj] = useState('');
  const [ulog, setUlog] = useState('');
  const [povijest, setPovijest] = useState([]);

  const [privatnaPoruka, setPrivatnaPoruka] = useState('');

  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [trajanje, setTrajanje] = useState(30); 
  const [sviKorisnici, setSviKorisnici] = useState([]);

  // DOHVAĆANJE PODATAKA + SIGURNOST
  useEffect(() => {
    // --- SIGURNOSNA PROVJERA ---
    const isAdmin = localStorage.getItem("adminLogiran");
    if (isAdmin !== "true") {
      navigate('/login');
      return;
    }
    // ---------------------------

    const povijestRef = ref(db, 'podaci/povijest');
    onValue(povijestRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([id, vrijednost]) => ({ id, ...vrijednost }));
        setPovijest(lista.reverse());
      } else {
        setPovijest([]);
      }
    });

    const korisniciRef = ref(db, 'korisnici');
    onValue(korisniciRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([id, vrijednost]) => ({ id, ...vrijednost }));
        setSviKorisnici(lista);
      } else {
        setSviKorisnici([]);
      }
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminLogiran"); // Briše ključ pri odjavi
    localStorage.removeItem("isAdmin");
    window.location.href = '/';
  };

  // --- ARHIVIRANJE I RESETIRANJE ---
  const handleArchiveMonth = async () => {
    const imeMjeseca = prompt("Unesite naziv arhive (npr. Travanj 2026):");
    if (!imeMjeseca) return;
    if (povijest.length === 0) return alert("Nema tiketa za arhiviranje!");

    if (window.confirm(`Jeste li sigurni da želite arhivirati pod nazivom "${imeMjeseca}"? Ovo će resetirati trenutni profit na 0.`)) {
      try {
        await set(ref(db, `podaci/arhiva/${imeMjeseca}`), povijest);
        await remove(ref(db, 'podaci/povijest'));
        await set(ref(db, 'podaci/ukupniProfit'), 0);
        alert("✅ MJESEC ARHIVIRAN I PROFIT RESETIRAN!");
      } catch (error) {
        alert("Greška: " + error.message);
      }
    }
  };

  const handleAddUser = async () => {
    if (!userEmail || !userPass) return alert("Email i lozinka su obavezni!");
    const datumIsteka = new Date();
    datumIsteka.setDate(datumIsteka.getDate() + Number(trajanje));
    try {
      const userKey = userEmail.replace(/\./g, '_');
      await set(ref(db, `korisnici/${userKey}`), {
        email: userEmail,
        password: userPass,
        istek: datumIsteka.toISOString(),
        vrijemeKreiranja: new Date().toLocaleString()
      });
      alert(`✅ KORISNIK DODAN! Istječe: ${datumIsteka.toLocaleDateString()}`);
      setUserEmail(''); setUserPass('');
    } catch (error) { alert(error.message); }
  };

  const handleUpdateStats = async () => {
    if (!prolaznost || !clanovi) return alert("Popuni polja!");
    await set(ref(db, 'podaci/stats'), { prolaznost: Number(prolaznost), clanovi: Number(clanovi) });
    alert("✅ STATISTIKA SPREMLJENA!");
  };

  const handleUpdateNews = async () => {
    if (!naslov || !opis) return alert("Naslov i opis obavezni!");
    await set(ref(db, 'podaci/obavijest'), { naslov, opis, slika: slika || "https://via.placeholder.com/1000" });
    alert("📢 OBAVIJEST OBJAVLJENA!");
  };

  const handleSendPrivateMessage = async () => {
    if (!privatnaPoruka) return alert("Upiši poruku!");
    try {
      await set(ref(db, 'podaci/porukaClanovima'), {
        tekst: privatnaPoruka,
        vrijeme: new Date().toLocaleTimeString()
      });
      alert("📩 PORUKA POSLANA ČLANOVIMA!");
      setPrivatnaPoruka('');
    } catch (error) { alert(error.message); }
  };

  const obrisiPoruku = async () => {
    await set(ref(db, 'podaci/porukaClanovima'), null);
    alert("🗑️ Poruka uklonjena!");
  };

  const handleSendAnalysis = async () => {
    if (!par || !vrijeme || !tip || !tecaj || !ulog || !datumUtakmice) {
      alert("⚠️ Popuni sva polja uključujući DATUM!");
      return;
    }
    try {
      const novaAnaliza = {
        par, vrijeme, tip, tecaj: Number(tecaj), ulog: Number(ulog),
        datum: datumUtakmice,
        status: 'pending',
        vrijemeObjave: new Date().toLocaleString()
      };
      
      const novaRef = push(ref(db, 'podaci/povijest'));
      const id = novaRef.key;
      await set(novaRef, { ...novaAnaliza, id: id });
      await set(ref(db, 'podaci/analiza'), { ...novaAnaliza, id: id });
      
      alert(`⚽ ANALIZA POSLANA!`);
      setPar(''); setVrijeme(''); setTip(''); setTecaj(''); setUlog(''); setDatumUtakmice('');
    } catch (error) { alert("Greška: " + error.message); }
  };

  const oznaciRezultat = async (id, status, ulogPostotak, tecajIznos) => {
    try {
      let promjenaProfita = status === 'win' ? ulogPostotak * (tecajIznos - 1) : -ulogPostotak;
      await update(ref(db, `podaci/povijest/${id}`), { status: status });
      
      const profitRef = ref(db, 'podaci/ukupniProfit');
      const snapshot = await get(profitRef);
      const trenutniProfit = snapshot.val() || 0;
      await set(profitRef, trenutniProfit + promjenaProfita);

      await set(ref(db, 'podaci/analiza'), null);
      
      alert(`Rezultat: ${status.toUpperCase()}`);
    } catch (error) { alert(error.message); }
  };

  const obrisiAnalizu = async (analiza) => {
    if (window.confirm("Obriši ovu analizu? Profit će biti vraćen na staro.")) {
      try {
        if (analiza.status !== 'pending') {
          const promjena = analiza.status === 'win' ? analiza.ulog * (analiza.tecaj - 1) : -analiza.ulog;
          const profitRef = ref(db, 'podaci/ukupniProfit');
          const snapshot = await get(profitRef);
          const trenutni = snapshot.val() || 0;
          await set(profitRef, trenutni - promjena);
        }
        await remove(ref(db, `podaci/povijest/${analiza.id}`));
        
        const aktivnaSnap = await get(ref(db, 'podaci/analiza'));
        if (aktivnaSnap.exists() && aktivnaSnap.val().id === analiza.id) {
          await set(ref(db, 'podaci/analiza'), null);
        }
      } catch (e) { alert(e.message); }
    }
  };

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <h2>PRVI KAT | ADMIN PANEL</h2>
        <button className="logout-btn" onClick={handleLogout}>ODJAVA</button>
      </nav>

      <div className="admin-content">
        <div className="admin-left">
          <section className="admin-section">
            <h3>👤 Dodaj/Uredi Člana</h3>
            <div className="admin-form">
              <input type="email" placeholder="Email korisnika" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
              <input type="text" placeholder="Lozinka" value={userPass} onChange={(e) => setUserPass(e.target.value)} />
              <input type="number" placeholder="Trajanje u danima" value={trajanje} onChange={(e) => setTrajanje(e.target.value)} />
              <button className="save-btn gold-btn" onClick={handleAddUser}>KREIRAJ ČLANA</button>
            </div>
            
            <div className="user-list-admin" style={{marginTop: '20px', maxHeight: '200px', overflowY: 'auto'}}>
              <h4>👥 Aktivni članovi:</h4>
              {sviKorisnici.map(u => (
                <div key={u.id} className="admin-history-card" style={{padding: '10px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <div>
                     <strong>{u.email}</strong> <br/>
                     <small>Istječe: {u.istek ? new Date(u.istek).toLocaleDateString() : 'Nema datuma'}</small>
                   </div>
                   <button className="delete-btn" onClick={() => remove(ref(db, `korisnici/${u.id}`))}>🗑️</button>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section">
            <h3>📊 Statistika & 📢 Obavijesti</h3>
            <div className="admin-form">
              <input type="number" placeholder="Prolaznost %" value={prolaznost} onChange={(e) => setProlaznost(e.target.value)} />
              <input type="number" placeholder="Broj članova" value={clanovi} onChange={(e) => setClanovi(e.target.value)} />
              <button className="save-btn" onClick={handleUpdateStats}>SPREMI STATSE</button>
              <hr />
              <input type="text" placeholder="Naslov obavijesti" value={naslov} onChange={(e) => setNaslov(e.target.value)} />
              <textarea 
                placeholder="Opis obavijesti..." 
                value={opis} 
                onChange={(e) => setOpis(e.target.value)}
                style={{minHeight: '150px', width: '100%', marginTop: '10px', background: '#111', color: 'white', padding: '10px'}}
              ></textarea>
              <input type="text" placeholder="URL Slike" value={slika} onChange={(e) => setSlika(e.target.value)} />
              <button className="save-btn" onClick={handleUpdateNews}>OBJAVI OBAVIJEST</button>
            </div>
          </section>
        </div>

        <div className="admin-right">
          <section className="admin-section">
            <h3>⚽ Nova Analiza</h3>
            <div className="admin-form">
              <div className="admin-row">
                <input type="text" placeholder="Par" value={par} onChange={(e) => setPar(e.target.value)} />
                <input type="date" value={datumUtakmice} onChange={(e) => setDatumUtakmice(e.target.value)} />
              </div>
              <div className="admin-row">
                <input type="text" placeholder="Vrijeme (npr. 20:45)" value={vrijeme} onChange={(e) => setVrijeme(e.target.value)} />
                <input type="text" placeholder="Tip" value={tip} onChange={(e) => setTip(e.target.value)} />
              </div>
              <div className="admin-row">
                <input type="number" placeholder="Tečaj" value={tecaj} onChange={(e) => setTecaj(e.target.value)} />
                <input type="number" placeholder="Ulog %" value={ulog} onChange={(e) => setUlog(e.target.value)} />
              </div>
              <button className="save-btn gold-btn" onClick={handleSendAnalysis}>OBJAVI ANALIZU</button>
            </div>
          </section>

          <section className="admin-section">
            <h3>📩 Privatna poruka članovima</h3>
            <div className="admin-form">
              <textarea 
                placeholder="Npr. Danas igramo jače uloge..." 
                value={privatnaPoruka} 
                onChange={(e) => setPrivatnaPoruka(e.target.value)}
                style={{minHeight: '100px'}}
              ></textarea>
              <div className="admin-row">
                <button className="save-btn gold-btn" onClick={handleSendPrivateMessage}>POŠALJI</button>
                <button className="save-btn" style={{background: '#444'}} onClick={obrisiPoruku}>UKLONI</button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="admin-section" style={{margin: '20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3>📜 Obrada rezultata & Povijest</h3>
          <button className="archive-btn" onClick={handleArchiveMonth} style={{background: '#ff4d4d', color: 'white', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>
            🚨 ARHIVIRAJ I RESETIRAJ MJESEC
          </button>
        </div>
        
        <div className="history-admin-list">
          {povijest.map((a) => (
            <div key={a.id} className={`history-admin-item ${a.status}`}>
              <div className="history-info">
                <strong>{a.par}</strong> - {a.tip} (@{a.tecaj}) - {a.ulog}% <br/>
                <small>Datum: {a.datum} | Objavljeno: {a.vrijemeObjave}</small>
              </div>
              <div className="admin-btns">
                {a.status === 'pending' ? (
                  <>
                    <button className="win-btn" onClick={() => oznaciRezultat(a.id, 'win', a.ulog, a.tecaj)}>✅ WIN</button>
                    <button className="loss-btn" onClick={() => oznaciRezultat(a.id, 'loss', a.ulog, a.tecaj)}>❌ LOSS</button>
                  </>
                ) : (
                  <span className={`status-label ${a.status}`}>{a.status.toUpperCase()}</span>
                )}
                <button className="delete-btn" onClick={() => obrisiAnalizu(a)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Admin;