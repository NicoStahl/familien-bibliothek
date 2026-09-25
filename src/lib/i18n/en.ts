// English texts. Must have exactly the shape of `de.ts` — the type annotation below makes a
// missing or misspelt key a build error.

import type { Woerterbuch } from "./de";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const en: Woerterbuch = {
  sprache: "en",
  sprachname: "English",
  appBeschreibung: "The family library with a barcode scanner",
  seitentitel: (seite) => `${seite} — Bücherfuchs`,

  nav: {
    hauptnavigation: "Main navigation",
    katalog: "Catalogue",
    serien: "Series",
    hinzufuegen: "Add",
    verliehen: "Lent out",
    mehr: "More",
  },

  kategorien: {
    Bilderbuch: "Picture book",
    Erstleser: "Early reader",
    Kinderroman: "Children's novel",
    Jugendbuch: "Young adult",
    "Sachbuch Kinder": "Children's non-fiction",
    Roman: "Novel",
    Sachbuch: "Non-fiction",
    Comic: "Comic",
    Kochbuch: "Cookbook",
    Sonstiges: "Other",
  },

  datum: {
    lang: (tag, monat, jahr) => `${tag} ${MONTHS[monat - 1]} ${jahr}`,
    seitHeute: "since today",
    seitGestern: "since yesterday",
    seitTagen: (n) => `for ${n} days`,
    seitMonaten: (n) => `for ${n} ${n === 1 ? "month" : "months"}`,
    seitJahren: (n) => `for ${n} ${n === 1 ? "year" : "years"}`,
    ohneDatum: "no date",
  },

  stoerung: {
    kontingent: (dienst) => `${dienst} has used up its daily quota`,
    ausfall: (dienst) => `${dienst} did not respond`,
    beide: (teile) => `Whether this book is known can't be said right now: ${teile}.`,
    einer: (teile) =>
      `The book may be known after all: ${teile}, so only the other service could be asked.`,
    spaeter: "Try again later — or enter the details by hand now.",
    schluessel:
      "Your own Google Books key (GOOGLE_BOOKS_API_KEY in the .env) fixes this for good.",
  },

  katalog: {
    anzahlBuecher: (n) => (n === 1 ? "1 book" : `${n} books`),
    scannen: "Scan barcode",
    treffer: (n) => (n === 1 ? "1 match" : `${n} matches`),
    keinTreffer: "No book matches this selection.",
    filterZuruecksetzen: "Reset filters",
    leer: "The shelf is still empty.",
    leerText:
      "Scan the barcode on the back of a book — title, author and cover will follow on their own.",
    erstesBuch: "Add your first book",
  },

  filter: {
    sucheLabel: "Search books",
    suchePlatzhalter: "Title or author",
    kategorieLabel: "Filter by category",
    kategorie: "Category",
    besitzerLabel: "Filter by owner",
    besitzer: "Owner",
    serieLabel: "Filter by series",
    serie: "Series",
    statusLabel: "Filter by loan status",
    status: "Status",
    zuhause: "At home",
    verliehen: "Lent out",
  },

  kachel: {
    gehoert: (name) => `Belongs to ${name}`,
    verliehenAn: (name) => `Lent to ${name}`,
  },

  buch: {
    katalog: "Catalogue",
    coverVon: (titel) => `Cover of ${titel}`,
    gehoert: (name) => `Belongs to ${name}`,
    band: (n) => `Volume ${n}`,
    verlag: "Publisher",
    jahr: "Year",
    isbn: "ISBN",
    bearbeiten: "Edit",
    bearbeitenTitel: "Edit book",
    loeschen: (titel) => `Delete ${titel}`,
    abbrechen: "Cancel",
    wirklichLoeschen: "Really delete",
    aenderungenSpeichern: "Save changes",
  },

  ausleihe: {
    verliehen: "Lent out",
    an: (name) => `to ${name}`,
    bei: (name) => `with ${name}`,
    zurueckbekommen: "Got it back",
    verleihen: "Lend out",
    anWen: "To whom",
    anWenPlatzhalter: "e.g. Grandma",
    seit: "Since",
    vermerken: "Save",
  },

  verliehenSeite: {
    titel: "Lent out",
    alleZuhause: "All books are at home.",
    unterwegs: (n) => (n === 1 ? "1 book out" : `${n} books out`),
  },

  formular: {
    ohneCover: "No cover",
    eigenesFoto: "Own photo",
    fotoErsetzt: "Your own photo replaces the cover above.",
    ohneFoto: "Without a photo, the catalogue shows a placeholder with the title.",
    titel: "Title",
    autor: "Author",
    kategorie: "Category",
    besitzer: "Owner",
    bitteWaehlen: "Please choose",
    serie: "Series",
    keineSerie: "No series",
    neueSerie: "New series …",
    seriePlatzhalter: "e.g. Eragon",
    band: "Volume",
    weitereAngaben: "More details",
    verlag: "Publisher",
    keinVerlag: "No publisher",
    neuerVerlag: "New publisher …",
    verlagPlatzhalter: "e.g. Puffin",
    jahr: "Year",
    isbn: "ISBN",
    isbnHinweis: "An ISBN-10 is converted to ISBN-13 when saving. Hyphens don't matter.",
    dochAusDerListe: "Pick from the list instead",
    wirdGespeichert: "Saving …",
    insRegal: "Put on the shelf",
  },

  hinzufuegen: {
    reiter: "Add",
    titel: "Add a book",
    einleitung:
      "The barcode on the back is the ISBN. Title, author, publisher and cover follow on their own.",
    handHinweis:
      "If the barcode can't be read — torn, covered, too dark — you can type the ISBN instead. It's printed as digits below the barcode or on the copyright page.",
    ohneIsbnHinweis: "Older books and many picture books have no ISBN at all.",
    ohneBarcode: "Add without barcode",
    zurueck: "Scan",
    manuellTitel: "Add by hand",
    manuellUntertitel: "Only title and owner are required. Everything else can be added later.",
    gefunden: "Found",
    nichtAbrufbar: "Not available",
    nichtsGefunden: "Nothing found",
    gefundenUntertitel: "Please choose an owner and check the details.",
    nichtsGefundenUntertitel:
      "The book directories know no title for this ISBN. Enter the details by hand — the ISBN is already filled in.",
    duplikatEins: (besitzer) =>
      `Heads up: this book is already on the shelf and belongs to ${besitzer}.`,
    duplikatMehrere: (n) => `Heads up: this book is already on the shelf ${n} times.`,
    duplikatOk: "Adding a second copy is fine — if there really are two.",
    exemplarVon: (besitzer) => `${besitzer}'s copy`,
  },

  isbnEingabe: {
    label: "Enter ISBN by hand",
    suchen: "Search",
    leer: "Please enter an ISBN.",
    laenge: "An ISBN has ten or thirteen digits. Hyphens and spaces may stay.",
    keinBuch:
      "This number doesn't start with 978 or 979, so it isn't a book barcode — probably a magazine or another product.",
    pruefziffer: "The check digit doesn't match. Usually a digit is swapped or mistyped.",
  },

  scanner: {
    kameraAbgelehnt:
      "Access to the camera was denied. Allow the camera for this site in your browser settings and reload the page.",
    keineKamera: "No camera was found.",
    kameraBelegt: "The camera is currently being used by another program.",
    kameraFehler: "The camera could not be started.",
    nurHttps:
      "The camera is only available over HTTPS. On a computer it works via localhost, on a phone only via the app's HTTPS address.",
    startet: "Starting camera …",
    laeuft: "Hold the barcode on the back of the book in front of the camera.",
    sucht: (isbn) => `ISBN ${isbn} — looking up title …`,
    vonHand: "Add book by hand",
    abfrageGescheitert:
      "The request didn't reach Bücherfuchs; the book directories were never asked. Try again later — or enter the details by hand now.",
    duplikatEins: (besitzer) => `This book is already on the shelf — it belongs to ${besitzer}.`,
    duplikatMehrere: (n, besitzer) => `This book is already on the shelf ${n} times: ${besitzer}.`,
    exemplarVon: (besitzer) => `${besitzer}'s copy`,
    titelNichtAbrufbar: "Title not available",
    keinTitel: "No title found",
    unbekannt:
      "Neither Google Books nor Open Library knows this ISBN. You can enter title and author by hand in the next step — the ISBN is kept.",
    aufnehmen: "Add to the shelf",
    naechstes: "Scan next book",
  },

  serien: {
    titel: "Series",
    einleitung: "Everything that belongs to a series — and what's missing in between.",
    leer: "No series on the shelf yet. As soon as a book has a series, it shows up here.",
    baende: (n) => (n === 1 ? "1 volume" : `${n} volumes`),
    luecke: (baende) => `gap at ${baende}`,
    imRegal: (n) => (n === 1 ? "1 volume on the shelf" : `${n} volumes on the shelf`),
    band: (n) => `Volume ${n}`,
    koennteDazugehoeren: "Might also belong here",
    vorschlagHinweis:
      "Searched by series name and taken over unchecked. There may well be titles here that have nothing to do with the series — colouring books, say, or companion guides.",
    wirdGesucht: "Searching …",
    keineWeiteren: "No further titles found.",
    quelle: (quelle) => `Source: ${quelle}`,
    ohneAngaben: "no details",
    habenWir: "We have it after all — add",
    umbenennen: (name) => `Rename ${name}`,
    umbenennenLabel: "Rename series",
    umbenennenHinweis: "Applies to all volumes. If the new name already exists, both series merge into one.",
    umbenennenKnopf: "Rename",
    abbrechen: "Cancel",
  },

  mehr: {
    titel: "More",
    export: "Export",
    exportText:
      "The whole catalogue as a CSV file — handy as proof for the insurance, should anything ever go missing.",
    zeilen: (n) => (n === 1 ? "1 row" : `${n} rows`),
    exportFormat: "semicolon-separated, for Excel",
    exportieren: "Export catalogue",
    sprache: "Language",
    spracheText: "Applies to this device and this browser.",
    anmeldung: "Sign-in",
    angemeldetAls: "Signed in as",
    anmeldungText:
      "Sign-in goes through the SSO account. Signing out only ends the Bücherfuchs session — you stay signed in with the SSO provider.",
    abmelden: "Sign out",
    ueber: "About",
    ueberText: "The family library. Runs on your own server; the data never leaves the house.",
    version: (v) => `Version ${v}`,
  },

  csv: {
    spalten: [
      "Title", "Author", "ISBN", "Category", "Owner", "Series", "Volume", "Publisher", "Year",
      "Lent to", "Lent since", "Added on",
    ],
    dateiname: "buecherfuchs-catalogue",
  },

  devLogin: {
    text: "Sign-in for local development. This page doesn't exist in production — there, sign-in goes through SSO only.",
    benutzername: "Username",
    leer: "Please enter a username.",
    anmelden: "Sign in",
  },

  loginFehler: {
    titel: "Sign-in failed",
    allgemein: "Sign-in failed.",
    config:
      "The SSO credentials are missing on the server (OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET or OIDC_REDIRECT_URI).",
    state:
      "The sign-in could not be matched. This happens when it took too long or was started in another window. Please try again.",
    exchange:
      "The SSO provider rejected the sign-in. Usually the sign-in link was already used — then simply try again. If it keeps happening, the application settings there don't match the app's (client ID, client secret or redirect URI).",
    grund: (grund) => `Reason: ${grund}`,
    nochmal: "Try again",
  },
};
