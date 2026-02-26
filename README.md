# Kurtech Projekte

**KurTech Elektrotechnik GmbH** — Interne Projektübersicht & Zeiterfassung

## Features

- 🔐 JWT-Authentifizierung (Admin / Nutzer)
- 📋 31 Projekte vorgeladen, neue Projekte anlegen
- ⏱ Zeiterfassung pro Projekt (Datum, Stunden, Beschreibung)
- ⭐ Favoriten pro Nutzer
- 🗺️ Google Maps Integration
- 🐳 Docker-ready, SQLite-Datenbank persistent via Volume

## Stack

- **Backend:** Node.js + Express
- **Datenbank:** SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt
- **Frontend:** Vanilla HTML/CSS/JS (kein Framework)
- **Deployment:** Docker + docker-compose

## Schnellstart (VPS)

```bash
# 1. Klonen
git clone https://github.com/support-star/kurtech-projekte.git
cd kurtech-projekte

# 2. .env anlegen
cp .env.example .env
nano .env   # JWT_SECRET ändern!

# 3. Starten
docker-compose up -d --build
```

App läuft auf Port **3000**.

## Hinter Nginx

```nginx
server {
    server_name projekte.deine-domain.de;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Standard-Login

| Benutzer | Passwort | Rolle |
|---|---|---|
| `admin` | `kurtech2026` | Admin |
| `samir` | `kurtech2026` | Nutzer |

> ⚠️ Passwörter vor dem ersten Start in `.env` ändern!

## API-Endpunkte

```
POST   /api/auth/login              Login → JWT
GET    /api/projects                Alle Projekte
POST   /api/projects                Neues Projekt
DELETE /api/projects/:id            Löschen (Admin)
POST   /api/projects/:id/favorite   Favorit togglen
GET    /api/entries/:projectId      Zeiteinträge laden
POST   /api/entries/:projectId      Zeiteintrag speichern
DELETE /api/entries/:pid/:eid       Eintrag löschen (Admin)
GET    /api/auth/users              Nutzer verwalten (Admin)
```

---

*KurTech Elektrotechnik GmbH · Frankfurt / Darmstadt*
