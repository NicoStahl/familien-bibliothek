<a id="deutsch"></a>

# Bücherfuchs

**Deutsch** · [English](#english)

Eine Familienbibliothek für den eigenen Server. Bücher werden per Barcode-Scan mit der
Handy-Kamera erfasst; Titel, Autor, Verlag und Cover kommen von Google Books und Open Library.
Gedacht für den Betrieb im Heimnetz, etwa auf einer Synology-NAS mit Docker — die Daten
verlassen das Haus nicht.

Die Oberfläche gibt es auf Deutsch und Englisch. Sie ist fürs Handy gebaut, funktioniert aber
auch am Rechner.

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
- **Deutsch und Englisch**, umschaltbar pro Gerät unter „Mehr“
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
| `SPRACHE` | `de` oder `en`. Leer = Sprache des Browsers, sonst Deutsch. Die Wahl unter „Mehr“ geht immer vor. |
| `GOOGLE_BOOKS_API_KEY` | Optional, aber empfohlen: Ohne Schlüssel teilt man sich ein anonymes Kontingent, das oft erschöpft ist. Ein kostenloser Schlüssel (Google Cloud Console, Books API) reicht für 1000 Abfragen am Tag. |

**Besitzer und Anmeldung sind zwei verschiedene Dinge.** Angemeldet wird sich per OIDC; der
Besitzer ist nur eine Eigenschaft des Buchs. Kinder brauchen also kein eigenes Konto.

Die Kategorien stehen fest in `src/lib/kategorien.ts` und lassen sich dort ändern. In der
Datenbank steht immer der deutsche Name; übersetzt wird nur die Anzeige (`src/lib/i18n/`). Eine
neue Kategorie braucht deshalb einen Eintrag in beiden Wörterbüchern.

**Eine weitere Sprache** kommt als eigene Datei neben `src/lib/i18n/de.ts` dazu und wird in
`src/lib/i18n/index.ts` eingetragen. TypeScript meldet beim Bauen jeden fehlenden Text.

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

## Aufbau

```
src/lib/       db.ts (SQLite), schema.ts (Datenmodell), auth.ts + oidc.ts (Anmeldung)
               isbn.ts (Normalisierung, Prüfziffern), buchapi.ts (Google Books / Open Library)
               buecher.ts (CRUD, Duplikat-Suche, Serien), suche.ts (Filter), cover.ts (Ablage)
               kategorien.ts (feste Liste), besitzer.ts (aus BESITZER), csv.ts, datum.ts
               i18n/ (Wörterbücher de.ts und en.ts, Sprachwahl)
src/app/(app)/ alles hinter der Anmeldung, mit Tab-Leiste
src/app/api/   auth/, cover/ (Bildauslieferung), isbn/ (Scanner-Abfrage), export/ (CSV)
src/fonts/     Fraunces, Public Sans, IBM Plex Mono, Caveat — selbst ausgeliefert
design/        Farbpalette, Typografie und App-Icon
```

## Lizenz

[MIT](LICENSE). Die mitgelieferten Schriften stehen unter der SIL Open Font License.

---

<a id="english"></a>

# Bücherfuchs (English)

[Deutsch](#deutsch) · **English**

A family library for your own server. Books are added by scanning their barcode with a phone
camera; title, author, publisher and cover come from Google Books and Open Library. Meant to
run on a home network, for example on a Synology NAS with Docker — the data never leaves the
house.

The interface is available in German and English. It's built for phones, but works on a
computer too. The name is German for "book fox".

## Features

- **Catalogue as a cover grid** with full-text search and filters for category, owner, series
  and loan status
- **Three ways onto the shelf:** scan the barcode (ZXing, EAN-13), type the ISBN, or add a book
  without any ISBN
- **ISBN normalisation** (ISBN-10 → ISBN-13, check digits) and a duplicate warning that doesn't
  block — two siblings may each own the same book
- **Cover chain** Google Books → Open Library → Amazon, detecting "image not available"
  placeholders; you can also upload your own photo
- **Series** with gap detection, renaming, and automatic matching against your own catalogue
- **Lending:** to whom, since when, and a list of all books currently lent out
- **CSV export**
- **Sign-in via OIDC** (tested with Synology SSO Server); without OIDC, a dev login for local
  development
- **German and English**, switchable per device under "More"
- Installable as a web app on the home screen

## Tech

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4, SQLite via
`better-sqlite3`, `sharp` for cover images. A single Docker container; database and covers live
in two volumes.

## Running locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env    # leave the OIDC values empty to get the dev login
npm run dev -- -p 3004
```

Then open `http://localhost:3004`. Without OIDC values a username is enough, no password. The
dev login does not exist in production.

The barcode scanner needs the camera, which browsers only allow in a secure context: on a
computer via `localhost`, on a phone only via HTTPS.

## Configuration

Copy `.env.example` to `.env` and fill it in. The file is not committed.

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs the session cookie. Required in production, otherwise the app won't start. |
| `COOKIE_SECURE` | Set to `1` once the app is served over HTTPS. |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI` | Sign-in via OIDC. If missing, the dev login is used outside production. |
| `ADMIN_USERNAMES` | Comma-separated. Empty = the first user to sign in becomes admin. |
| `BESITZER` | Who owns the books, e.g. `Anna,Ben,Clara`. Optionally with a badge colour: `Clara:#8A4B62`. Empty = a single owner called "Familie". |
| `SPRACHE` | `de` or `en`. Empty = the browser's language, otherwise German. The choice under "More" always wins. |
| `GOOGLE_BOOKS_API_KEY` | Optional but recommended: without a key you share an anonymous quota that is often exhausted. A free key (Google Cloud Console, Books API) allows 1000 requests a day. |

**Owners and sign-in are two different things.** Sign-in goes through OIDC; the owner is just
a property of the book. Children don't need an account.

Categories are fixed in `src/lib/kategorien.ts` and can be changed there. The database always
stores the German name; only the display is translated (`src/lib/i18n/`), so a new category
needs an entry in both dictionaries.

**Another language** is added as a new file next to `src/lib/i18n/de.ts` and registered in
`src/lib/i18n/index.ts`. TypeScript reports every missing text at build time.

## Running with Docker

```bash
docker compose up -d --build
```

`docker-compose.yml` binds the container to `127.0.0.1:3004` only; put a reverse proxy with
HTTPS in front of it (on Synology: Login Portal → Reverse Proxy). The `data/` and `cover/`
directories next to `docker-compose.yml` must be writable for the container user (UID 1001):

```bash
mkdir -p data cover && sudo chown -R 1001:1001 data cover
```

To back up, `data/`, `cover/` and the `.env` are all you need.

**With Synology SSO:** create an application under *SSO Server* in DSM. The redirect URI must
match `OIDC_REDIRECT_URI` **exactly**, i.e. `https://<your-address>/api/auth/callback`. DSM
reports a mismatch only as "invalid SSO client application", and only during the token
exchange.

## Known limitations

- **One build step without certificate checks.** The Dockerfile installs `ca-certificates` with
  peer verification switched off, because the base image had no certificates in the original
  environment. In a normal environment you can drop the `-o Acquire::https::Verify-*` and
  `--allow-unauthenticated` options.
- **The Amazon cover step uses an undocumented image URL.** It only kicks in when Google and
  Open Library have no image. For a private catalogue that's harmless; if you'd rather not,
  remove `amazonCoverUrl()` from `src/lib/cover.ts`.
- **The code is written in German** — identifiers and comments alike.

## Licence

[MIT](LICENSE). The bundled fonts are licensed under the SIL Open Font License.
