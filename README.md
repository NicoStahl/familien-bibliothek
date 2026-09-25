# Bücherfuchs

Eine Familienbibliothek für den eigenen Server. Bücher werden per Barcode-Scan mit der
Handy-Kamera erfasst; Titel, Autor, Verlag und Cover kommen von Google Books und Open Library.
Gedacht für den Betrieb im Heimnetz, etwa auf einer Synology-NAS mit Docker — die Daten
verlassen das Haus nicht.

Die Oberfläche ist auf Deutsch und fürs Handy gebaut, funktioniert aber auch am Rechner.

## Funktionen

- **Katalog als Cover-Grid** mit Volltextsuche und Filtern nach Kategorie, Besitzer, Serie und
  Ausleihstatus
- **Drei Wege ins Regal:** Barcode scannen (ZXing, EAN-13), ISBN von Hand eingeben, oder ein
  Buch ganz ohne ISBN eintragen
- **ISBN-Normalisierung** (ISBN-10 → ISBN-13, Prüfziffern) und eine Duplikat-Warnung, die nicht
  blockiert — zwei Geschwister dürfen dasselbe Buch je einmal besitzen
- **Cover-Kette** Google Books → Open Library → Amazon, mit Erkennung der Platzhalterbilder
  („Bild nicht verfügbar"); eigene Fotos lassen sich hochladen
- **Serien** mit Lückenanzeige, Umbenennen und automatischer Erkennung aus dem eigenen Katalog
- **Ausleihe:** an wen, seit wann, und eine Liste aller verliehenen Bücher
- **CSV-Export**
- **Anmeldung per OIDC** (erprobt mit dem Synology SSO Server), ohne OIDC ein Dev-Login für die
  lokale Entwicklung
- Als Web-App auf den Startbildschirm installierbar

## Technik

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4, SQLite über
`better-sqlite3`, `sharp` für die Coverbilder. Ein einzelner Docker-Container; Datenbank und
Cover liegen in zwei Volumes.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
cp .env.example .env    # OIDC-Werte leer lassen, dann greift das Dev-Login
npm run dev -- -p 3004
```

Danach unter `http://localhost:3004` aufrufen. Ohne OIDC-Werte genügt ein Benutzername, kein
Passwort. In Produktion gibt es dieses Dev-Login nicht.

Der Barcode-Scanner braucht die Kamera, und die gibt der Browser nur in einem sicheren Kontext
frei: am Rechner über `localhost`, am Handy erst über HTTPS.

## Konfiguration

`.env.example` nach `.env` kopieren und füllen. Die Datei wird nicht eingecheckt.

| Variable | Wofür |
|---|---|
| `SESSION_SECRET` | Signiert das Session-Cookie. In Produktion Pflicht, sonst startet die App nicht. |
| `COOKIE_SECURE` | Auf `1`, sobald die App über HTTPS erreichbar ist. |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI` | Anmeldung per OIDC. Fehlen sie, greift außerhalb von Produktion das Dev-Login. |
| `ADMIN_USERNAMES` | Kommagetrennt. Leer = der zuerst angemeldete Nutzer wird Admin. |
| `BESITZER` | Wem die Bücher gehören, z. B. `Anna,Ben,Clara`. Optional mit Badge-Farbe: `Clara:#8A4B62`. Leer = ein Besitzer „Familie". |
| `GOOGLE_BOOKS_API_KEY` | Optional, aber empfohlen: Ohne Schlüssel teilt man sich ein anonymes Kontingent, das oft erschöpft ist. Ein kostenloser Schlüssel (Google Cloud Console, Books API) reicht für 1000 Abfragen am Tag. |

**Besitzer und Anmeldung sind zwei verschiedene Dinge.** Angemeldet wird sich per OIDC; der
Besitzer ist nur eine Eigenschaft des Buchs. Kinder brauchen also kein eigenes Konto.

Die Kategorien stehen fest in `src/lib/kategorien.ts` und lassen sich dort ändern.

## Betrieb mit Docker

```bash
docker compose up -d --build
```

Die `docker-compose.yml` bindet den Container nur an `127.0.0.1:3004`; erreichbar wird die App
über einen Reverse Proxy mit HTTPS davor (bei Synology: Anmeldeportal → Reverse Proxy). Die
Verzeichnisse `data/` und `cover/` neben der `docker-compose.yml` müssen für den
Container-Benutzer (UID 1001) beschreibbar sein:

```bash
mkdir -p data cover && sudo chown -R 1001:1001 data cover
```

Zum Sichern genügen `data/`, `cover/` und die `.env`.

**Mit Synology SSO:** In DSM unter *SSO Server* eine Anwendung anlegen. Die Redirect-URI muss
**zeichengenau** mit `OIDC_REDIRECT_URI` übereinstimmen, also
`https://<deine-adresse>/api/auth/callback`. Eine Abweichung meldet DSM nur als „Ungültige
SSO-Client-Anwendung", und zwar erst beim Token-Austausch.

## Bekannte Einschränkungen

- **Build ohne Zertifikatsprüfung für einen Schritt.** Das Dockerfile installiert
  `ca-certificates` mit abgeschalteter Peer-Prüfung, weil das Basisimage in der ursprünglichen
  Umgebung keine Zertifikate mitbrachte. Wer in einer normalen Umgebung baut, kann die
  `-o Acquire::https::Verify-*`- und `--allow-unauthenticated`-Optionen entfernen.
- **Die Amazon-Cover-Stufe nutzt eine undokumentierte Bildadresse.** Sie greift nur, wenn Google
  und Open Library kein Bild haben. Für einen privaten Katalog ist das folgenlos; wer das nicht
  möchte, entfernt `amazonCoverUrl()` aus `src/lib/cover.ts`.
- Die Oberfläche gibt es derzeit nur auf Deutsch.

## Aufbau

```
src/lib/       db.ts (SQLite), schema.ts (Datenmodell), auth.ts + oidc.ts (Anmeldung)
               isbn.ts (Normalisierung, Prüfziffern), buchapi.ts (Google Books / Open Library)
               buecher.ts (CRUD, Duplikat-Suche, Serien), suche.ts (Filter), cover.ts (Ablage)
               kategorien.ts (feste Liste), besitzer.ts (aus BESITZER), csv.ts, datum.ts
src/app/(app)/ alles hinter der Anmeldung, mit Tab-Leiste
src/app/api/   auth/, cover/ (Bildauslieferung), isbn/ (Scanner-Abfrage), export/ (CSV)
src/fonts/     Fraunces, Public Sans, IBM Plex Mono, Caveat — selbst ausgeliefert
design/        Farbpalette, Typografie und App-Icon
```

## Lizenz

[MIT](LICENSE). Die mitgelieferten Schriften stehen unter der SIL Open Font License.
