// Alle Texte der Oberfläche auf Deutsch. Das ist die maßgebliche Fassung: `en.ts` muss
// dieselbe Form haben (siehe den Typ `Woerterbuch`), sonst baut die App nicht — ein
// vergessener Text fällt damit beim Bauen auf und nicht erst am Handy.
//
// Texte mit Zahlen oder Namen sind Funktionen statt Platzhalter-Zeichenketten: So prüft
// TypeScript auch die Argumente, und Einzahl/Mehrzahl entscheidet jede Sprache selbst.
//
// Nicht übersetzt werden Log- und Fehlermeldungen, die nur im Containerlog landen, und die
// Namen der Besitzer — die kommen aus der Konfiguration.

import type { Kategorie } from "@/lib/kategorien";

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export const de = {
  sprache: "de",
  sprachname: "Deutsch",
  appBeschreibung: "Die Familienbibliothek mit Barcode-Scanner",
  seitentitel: (seite: string) => `${seite} — Bücherfuchs`,

  nav: {
    hauptnavigation: "Hauptnavigation",
    katalog: "Katalog",
    serien: "Serien",
    hinzufuegen: "Hinzufügen",
    verliehen: "Verliehen",
    mehr: "Mehr",
  },

  kategorien: {
    Bilderbuch: "Bilderbuch",
    Erstleser: "Erstleser",
    Kinderroman: "Kinderroman",
    Jugendbuch: "Jugendbuch",
    "Sachbuch Kinder": "Sachbuch Kinder",
    Roman: "Roman",
    Sachbuch: "Sachbuch",
    Comic: "Comic",
    Kochbuch: "Kochbuch",
    Sonstiges: "Sonstiges",
  } satisfies Record<Kategorie, string> as Record<Kategorie, string>,

  datum: {
    lang: (tag: number, monat: number, jahr: string) => `${tag}. ${MONATE[monat - 1]} ${jahr}`,
    seitHeute: "seit heute",
    seitGestern: "seit gestern",
    seitTagen: (n: number) => `seit ${n} Tagen`,
    seitMonaten: (n: number) => `seit ${n} ${n === 1 ? "Monat" : "Monaten"}`,
    seitJahren: (n: number) => `seit ${n} ${n === 1 ? "Jahr" : "Jahren"}`,
    ohneDatum: "ohne Datum",
  },

  stoerung: {
    kontingent: (dienst: string) => `${dienst} hat sein Tageskontingent erschöpft`,
    ausfall: (dienst: string) => `${dienst} hat nicht geantwortet`,
    beide: (teile: string) => `Ob dieses Buch bekannt ist, lässt sich gerade nicht sagen: ${teile}.`,
    einer: (teile: string) =>
      `Das Buch ist womöglich doch bekannt: ${teile}, gefragt werden konnte nur der zweite Dienst.`,
    spaeter: "Später noch einmal versuchen — oder die Angaben jetzt von Hand eintragen.",
    schluessel:
      "Ein eigener Google-Books-Schlüssel (GOOGLE_BOOKS_API_KEY in der .env) beendet das dauerhaft.",
  },

  katalog: {
    anzahlBuecher: (n: number) => (n === 1 ? "1 Buch" : `${n} Bücher`),
    scannen: "Barcode scannen",
    treffer: (n: number) => (n === 1 ? "1 Treffer" : `${n} Treffer`),
    keinTreffer: "Kein Buch passt zu dieser Auswahl.",
    filterZuruecksetzen: "Filter zurücksetzen",
    leer: "Das Regal ist noch leer.",
    leerText:
      "Scanne den Barcode auf der Rückseite eines Buchs — Titel, Autor und Cover kommen dann von allein.",
    erstesBuch: "Erstes Buch aufnehmen",
  },

  filter: {
    sucheLabel: "Bücher durchsuchen",
    suchePlatzhalter: "Titel oder Autor",
    kategorieLabel: "Nach Kategorie filtern",
    kategorie: "Kategorie",
    besitzerLabel: "Nach Besitzer filtern",
    besitzer: "Besitzer",
    serieLabel: "Nach Serie filtern",
    serie: "Serie",
    statusLabel: "Nach Ausleihstatus filtern",
    status: "Status",
    zuhause: "Zuhause",
    verliehen: "Verliehen",
  },

  kachel: {
    gehoert: (name: string) => `Gehört ${name}`,
    verliehenAn: (name: string) => `Verliehen an ${name}`,
  },

  buch: {
    katalog: "Katalog",
    coverVon: (titel: string) => `Cover von ${titel}`,
    gehoert: (name: string) => `Gehört ${name}`,
    band: (n: number) => `Band ${n}`,
    verlag: "Verlag",
    jahr: "Jahr",
    isbn: "ISBN",
    bearbeiten: "Bearbeiten",
    bearbeitenTitel: "Buch bearbeiten",
    loeschen: (titel: string) => `${titel} löschen`,
    abbrechen: "Abbrechen",
    wirklichLoeschen: "Wirklich löschen",
    aenderungenSpeichern: "Änderungen speichern",
  },

  ausleihe: {
    verliehen: "Verliehen",
    an: (name: string) => `an ${name}`,
    bei: (name: string) => `bei ${name}`,
    zurueckbekommen: "Zurückbekommen",
    verleihen: "Verleihen",
    anWen: "An wen",
    anWenPlatzhalter: "z. B. Oma",
    seit: "Seit",
    vermerken: "Vermerken",
  },

  verliehenSeite: {
    titel: "Verliehen",
    alleZuhause: "Alle Bücher sind zuhause.",
    unterwegs: (n: number) => (n === 1 ? "1 Buch unterwegs" : `${n} Bücher unterwegs`),
  },

  formular: {
    ohneCover: "Ohne Cover",
    eigenesFoto: "Eigenes Foto",
    fotoErsetzt: "Ein eigenes Foto ersetzt das Cover oben.",
    ohneFoto: "Ohne Foto zeigt der Katalog einen Platzhalter mit dem Titel.",
    titel: "Titel",
    autor: "Autor",
    kategorie: "Kategorie",
    besitzer: "Besitzer",
    bitteWaehlen: "Bitte wählen",
    serie: "Serie",
    keineSerie: "Keine Serie",
    neueSerie: "Neue Serie …",
    seriePlatzhalter: "z. B. Eragon",
    band: "Band",
    weitereAngaben: "Weitere Angaben",
    verlag: "Verlag",
    keinVerlag: "Kein Verlag",
    neuerVerlag: "Neuer Verlag …",
    verlagPlatzhalter: "z. B. Carlsen",
    jahr: "Jahr",
    isbn: "ISBN",
    isbnHinweis: "Eine ISBN-10 wird beim Speichern in ISBN-13 umgerechnet. Bindestriche sind egal.",
    dochAusDerListe: "Doch aus der Liste",
    wirdGespeichert: "Wird gespeichert …",
    insRegal: "Ins Regal stellen",
  },

  hinzufuegen: {
    reiter: "Hinzufügen",
    titel: "Buch aufnehmen",
    einleitung:
      "Der Strichcode auf der Rückseite ist die ISBN. Titel, Autor, Verlag und Cover kommen danach von allein.",
    handHinweis:
      "Lässt sich der Barcode nicht lesen — abgerissen, überklebt, zu dunkel — geht die ISBN auch von Hand. Sie steht als Ziffernfolge unter dem Strichcode oder im Impressum.",
    ohneIsbnHinweis: "Ältere Bücher und viele Bilderbücher tragen gar keine ISBN.",
    ohneBarcode: "Ohne Barcode eintragen",
    zurueck: "Scannen",
    manuellTitel: "Von Hand eintragen",
    manuellUntertitel: "Nur Titel und Besitzer sind Pflicht. Alles andere lässt sich später ergänzen.",
    gefunden: "Gefunden",
    nichtAbrufbar: "Nicht abrufbar",
    nichtsGefunden: "Nichts gefunden",
    gefundenUntertitel: "Bitte Besitzer wählen und die Angaben prüfen.",
    nichtsGefundenUntertitel:
      "Zu dieser ISBN kennen die Buch-Verzeichnisse keinen Titel. Die Angaben von Hand eintragen — die ISBN ist bereits gespeichert.",
    duplikatEins: (besitzer: string) =>
      `Achtung: Dieses Buch steht schon im Regal und gehört ${besitzer}.`,
    duplikatMehrere: (n: number) => `Achtung: Dieses Buch steht schon ${n}-mal im Regal.`,
    duplikatOk: "Ein zweites Exemplar anzulegen ist in Ordnung — wenn es wirklich zweimal da ist.",
    exemplarVon: (besitzer: string) => `Exemplar von ${besitzer}`,
  },

  isbnEingabe: {
    label: "ISBN von Hand eingeben",
    suchen: "Suchen",
    leer: "Bitte eine ISBN eingeben.",
    laenge: "Eine ISBN hat zehn oder dreizehn Ziffern. Bindestriche und Leerzeichen dürfen bleiben.",
    keinBuch:
      "Diese Nummer beginnt nicht mit 978 oder 979 und ist damit kein Buch-Strichcode — vermutlich eine Zeitschrift oder ein anderes Produkt.",
    pruefziffer: "Die Prüfziffer stimmt nicht. Meist steckt eine verdrehte oder vertippte Ziffer darin.",
  },

  scanner: {
    kameraAbgelehnt:
      "Der Zugriff auf die Kamera wurde abgelehnt. In den Einstellungen des Browsers für diese Seite die Kamera erlauben und die Seite neu laden.",
    keineKamera: "Es wurde keine Kamera gefunden.",
    kameraBelegt: "Die Kamera wird gerade von einem anderen Programm benutzt.",
    kameraFehler: "Die Kamera ließ sich nicht starten.",
    nurHttps:
      "Die Kamera steht nur über HTTPS zur Verfügung. Am Rechner geht es über localhost, am Handy erst über die HTTPS-Adresse der App.",
    startet: "Kamera wird gestartet …",
    laeuft: "Den Barcode auf der Buchrückseite ins Bild halten.",
    sucht: (isbn: string) => `ISBN ${isbn} — Titel wird gesucht …`,
    vonHand: "Buch von Hand eintragen",
    abfrageGescheitert:
      "Die Anfrage kam nicht bis zum Bücherfuchs durch; die Buch-Verzeichnisse wurden gar nicht erst gefragt. Später noch einmal versuchen — oder die Angaben jetzt von Hand eintragen.",
    duplikatEins: (besitzer: string) => `Dieses Buch steht schon im Regal — es gehört ${besitzer}.`,
    duplikatMehrere: (n: number, besitzer: string) =>
      `Dieses Buch steht schon ${n}-mal im Regal: ${besitzer}.`,
    exemplarVon: (besitzer: string) => `Exemplar von ${besitzer}`,
    titelNichtAbrufbar: "Titel nicht abrufbar",
    keinTitel: "Kein Titel gefunden",
    unbekannt:
      "Weder Google Books noch Open Library kennen diese ISBN. Titel und Autor lassen sich im nächsten Schritt von Hand eintragen — die ISBN bleibt erhalten.",
    aufnehmen: "Ins Regal aufnehmen",
    naechstes: "Nächstes Buch scannen",
  },

  serien: {
    titel: "Serien",
    einleitung: "Alles, was zu einer Reihe gehört — und was dazwischen fehlt.",
    leer: "Noch keine Serie im Regal. Sobald bei einem Buch eine Serie eingetragen ist, taucht sie hier auf.",
    baende: (n: number) => (n === 1 ? "1 Band" : `${n} Bände`),
    luecke: (baende: string) => `Lücke bei ${baende}`,
    imRegal: (n: number) => (n === 1 ? "1 Band im Regal" : `${n} Bände im Regal`),
    band: (n: number) => `Band ${n}`,
    koennteDazugehoeren: "Könnte auch dazugehören",
    vorschlagHinweis:
      "Über den Seriennamen gesucht und ungeprüft übernommen. Es ist gut möglich, dass hier Titel stehen, die mit der Serie nichts zu tun haben — Malbücher etwa, oder Sekundärliteratur.",
    wirdGesucht: "Wird gesucht …",
    keineWeiteren: "Keine weiteren Titel gefunden.",
    quelle: (quelle: string) => `Quelle: ${quelle}`,
    ohneAngaben: "ohne Angaben",
    habenWir: "Haben wir doch — aufnehmen",
    umbenennen: (name: string) => `${name} umbenennen`,
    umbenennenLabel: "Serie umbenennen",
    umbenennenHinweis: "Gilt für alle Bände. Gibt es den neuen Namen schon, gehen beide Reihen in einer auf.",
    umbenennenKnopf: "Umbenennen",
    abbrechen: "Abbrechen",
  },

  mehr: {
    titel: "Mehr",
    export: "Export",
    exportText:
      "Der gesamte Katalog als CSV-Datei — unter anderem als Nachweis für die Versicherung, falls einmal etwas abhandenkommt.",
    zeilen: (n: number) => (n === 1 ? "1 Zeile" : `${n} Zeilen`),
    exportFormat: "Semikolon-getrennt, für Excel",
    exportieren: "Katalog exportieren",
    sprache: "Sprache",
    spracheText: "Gilt für dieses Gerät und diesen Browser.",
    anmeldung: "Anmeldung",
    angemeldetAls: "Angemeldet als",
    anmeldungText:
      "Die Anmeldung läuft über das SSO-Konto. Abmelden beendet nur die Sitzung im Bücherfuchs — beim SSO-Anbieter bleibst du angemeldet.",
    abmelden: "Abmelden",
    ueber: "Über die App",
    ueberText: "Die Familienbibliothek. Läuft auf dem eigenen Server, die Daten verlassen das Haus nicht.",
    version: (v: string) => `Version ${v}`,
  },

  csv: {
    spalten: [
      "Titel", "Autor", "ISBN", "Kategorie", "Besitzer", "Serie", "Band", "Verlag", "Jahr",
      "Ausgeliehen an", "Ausgeliehen seit", "Erfasst am",
    ],
    dateiname: "buecherfuchs-katalog",
  },

  devLogin: {
    text: "Anmeldung für die lokale Entwicklung. In Produktion gibt es diese Seite nicht — dort läuft die Anmeldung ausschließlich über SSO.",
    benutzername: "Benutzername",
    leer: "Bitte einen Benutzernamen eingeben.",
    anmelden: "Anmelden",
  },

  loginFehler: {
    titel: "Anmeldung fehlgeschlagen",
    allgemein: "Die Anmeldung ist fehlgeschlagen.",
    config:
      "Die SSO-Zugangsdaten fehlen auf dem Server (OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET oder OIDC_REDIRECT_URI).",
    state:
      "Die Anmeldung konnte nicht zugeordnet werden. Das passiert, wenn der Vorgang zu lange gedauert hat oder in einem anderen Fenster begonnen wurde. Bitte noch einmal versuchen.",
    exchange:
      "Der SSO-Anbieter hat die Anmeldung abgelehnt. Meist war der Anmeldelink schon verbraucht — dann genügt ein neuer Versuch. Bleibt es dabei, weichen die dort hinterlegten Angaben der Anwendung von denen der App ab (Client-ID, Client-Secret oder Redirect-URI).",
    grund: (grund: string) => `Grund: ${grund}`,
    nochmal: "Noch einmal versuchen",
  },
};

export type Woerterbuch = typeof de;
