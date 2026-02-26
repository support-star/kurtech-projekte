const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'kurtech.db');

// Ensure data directory exists
const fs = require('fs');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    UNIQUE NOT NULL,
    password  TEXT    NOT NULL,
    role      TEXT    NOT NULL DEFAULT 'user',
    created_at TEXT   DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    start_date  TEXT    NOT NULL,
    end_date    TEXT    NOT NULL,
    address     TEXT,
    contact     TEXT,
    notes       TEXT,
    is_static   INTEGER DEFAULT 0,
    created_by  TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id          TEXT    PRIMARY KEY,
    project_id  TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user        TEXT    NOT NULL,
    entry_date  TEXT    NOT NULL,
    hours       REAL    NOT NULL,
    description TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    username    TEXT NOT NULL,
    project_id  TEXT NOT NULL,
    PRIMARY KEY (username, project_id)
  );
`);

// ── Seed default users if none exist ────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (userCount.c === 0) {
  const adminPw = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'kurtech2026', 10);
  const userPw  = bcrypt.hashSync(process.env.USER_PASSWORD  || 'kurtech2026', 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', adminPw, 'admin');
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('samir', userPw, 'user');
  console.log('✓ Default users created (admin / samir)');
}

// ── Seed static projects if none exist ──────────────────────────────────────
const projCount = db.prepare('SELECT COUNT(*) as c FROM projects').get();
if (projCount.c === 0) {
  const staticProjects = [
    { id:'24029', name:'Syna GmbH Standort Bad Homburg',             start:'19.01.2026', end:'10.06.2026', addr:'Urseler Str. 44–46, 61348 Bad Homburg vor der Höhe' },
    { id:'24028', name:'Nastätten',                                   start:'12.01.2026', end:'28.01.2026', addr:'56355 Nastätten, Rhein-Lahn-Kreis' },
    { id:'24027', name:'Schäfer Shop Wetzlar – Elektrotechnische Arbeiten', start:'02.02.2026', end:'10.06.2026', addr:'Dillfeld 2, 35576 Wetzlar' },
    { id:'24026', name:'Pleidelsheim – Syna GmbH',                   start:'10.01.2026', end:'10.06.2026', addr:'Mundelsheimer Str. 1, 74385 Pleidelsheim' },
    { id:'24025', name:'Depot Sachsenhausen – Bruchstr./Hedderichstr.', start:'10.11.2025', end:'10.06.2026', addr:'Bruchstr./Hedderichstr., 60594 Frankfurt am Main' },
    { id:'24024', name:'Ludwigshafener Str. 4, Frankfurt',            start:'06.11.2025', end:'10.06.2026', addr:'Ludwigshafener Str. 4, 65929 Frankfurt am Main' },
    { id:'24023', name:'Aramark GmbH Verteilzentrum F3',              start:'06.11.2025', end:'10.06.2026', addr:'Heinrich-Lanz-Allee 18, 60437 Frankfurt am Main' },
    { id:'24022', name:'WEG Alt Nied 4-8, FFM',                      start:'18.10.2025', end:'10.06.2026', addr:'Alt-Nied 4-8, 65931 Frankfurt am Main' },
    { id:'24021', name:'Neubau Urbach II – Gewerk Elektroinstallation', start:'18.10.2025', end:'10.06.2026', addr:'Urbach, 60386 Frankfurt am Main' },
    { id:'24020', name:'UA RZ Dietzenbach 1 – E-Installation',        start:'18.10.2025', end:'10.06.2026', addr:'Dietzenbach, 63128 Hessen' },
    { id:'24019', name:'UA RZ Kastengrund',                           start:'25.10.2025', end:'10.06.2026', addr:'Kastengrund, 60326 Frankfurt am Main' },
    { id:'24018', name:'Große Gallusstraße 1-7, Frankfurt',           start:'30.08.2025', end:'10.06.2026', addr:'Große Gallusstraße 1-7, 60311 Frankfurt am Main' },
    { id:'24017', name:'Museum für Moderne Kunst',                    start:'01.07.2025', end:'10.06.2026', addr:'Domstraße 10, 60311 Frankfurt am Main' },
    { id:'24016', name:'YSL FFM – Saint Laurent Boutique',            start:'11.07.2025', end:'10.06.2026', addr:'Goethestr. 7, 60313 Frankfurt am Main' },
    { id:'24015', name:'Gebäudeautomation NEU – CL7',                 start:'09.07.2025', end:'10.06.2026', addr:'Baufeld A05, Frankfurt am Main' },
    { id:'24014', name:'Mainzerlandstr. 1, Frankfurt',                start:'05.11.2024', end:'19.11.2024', addr:'Mainzerlandstr. 1, 60329 Frankfurt am Main' },
    { id:'24013', name:'MARL Seafood GmbH',                           start:'23.10.2024', end:'06.11.2024', addr:'Jacques-Offenbach-Str. 2-6, 63069 Offenbach am Main' },
    { id:'24012', name:'Data Green Center Augsburg',                  start:'19.09.2024', end:'07.11.2024', addr:'Augsburg, Bayern' },
    { id:'24011', name:'Field House Wiesbaden Hainerberg',            start:'26.07.2024', end:'09.08.2024', addr:'Mississippistraße, 65189 Wiesbaden' },
    { id:'24010', name:'Merian Apotheke Bergerstr. 48, Frankfurt',    start:'26.07.2024', end:'09.08.2024', addr:'Bergerstr. 48, Frankfurt am Main' },
    { id:'23073', name:'Hausverwaltung Beudt',                        start:'18.04.2024', end:'30.06.2024', addr:'Frankfurt am Main' },
    { id:'23072', name:'Bickenbach – Darmstädter Str.',               start:'03.03.2024', end:'17.03.2024', addr:'Darmstädter Str., 64404 Bickenbach' },
    { id:'23071', name:'Villingen-Schwenningen',                      start:'25.01.2024', end:'08.02.2024', addr:'Paula-Straub-Straße, 78048 Villingen-Schwenningen' },
    { id:'23070', name:'Marktal 3, Hörselgau',                        start:'18.01.2024', end:'01.02.2024', addr:'Marktal 3, 99880 Hörselgau' },
    { id:'23069', name:'Industriepark Flörsheim',                     start:'16.01.2024', end:'30.01.2024', addr:'Böttgerstr. 2-14c, 65439 Flörsheim' },
    { id:'23068', name:'Milchhof Areal Ansbach',                      start:'10.01.2024', end:'24.01.2024', addr:'Milchhof-Areal, 91522 Ansbach' },
    { id:'23067', name:'Eckenheimer Landstraße 57A',                  start:'09.01.2024', end:'23.01.2024', addr:'Eckenheimer Landstraße 57A, Frankfurt am Main' },
    { id:'23066', name:'Hainer Trift 8, Dreieich',                    start:'09.01.2024', end:'23.01.2024', addr:'Hainer Trift 8, 63303 Dreieich' },
    { id:'23065', name:'Hainer Trift 8 (2)',                          start:'09.01.2024', end:'23.01.2024', addr:'Hainer Trift 8, 63303 Dreieich' },
    { id:'23064', name:'Billtalstrasse 26, Sulzbach',                 start:'09.01.2024', end:'23.01.2024', addr:'Billtalstraße 26, 65843 Sulzbach (Taunus)' },
    { id:'23063', name:'Wieseneckerstraße 3, Bischofsheim',           start:'05.02.2024', end:'31.03.2024', addr:'Wieseneckerstraße 3, 65474 Bischofsheim' },
  ];

  const ins = db.prepare(`
    INSERT INTO projects (id, name, start_date, end_date, address, is_static)
    VALUES (@id, @name, @start, @end, @addr, 1)
  `);
  const insertAll = db.transaction((projects) => {
    for (const p of projects) ins.run(p);
  });
  insertAll(staticProjects);
  console.log(`✓ ${staticProjects.length} static projects seeded`);
}

module.exports = db;
