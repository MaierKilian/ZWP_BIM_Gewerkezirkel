# ZWP BIM Quiz – Gewerkezirkel

Interaktives BIM-Quiz im ZWP-Design für den **BIM-Gewerkezirkel**. Besucher der
Markthallen-Stände geben ihren Namen ein, beantworten 15 Fragen rund um BIM, TGA
und die Arbeitsweise bei ZWP und landen anschließend in einer Bestenliste.

## Funktionen

- **Namensabfrage** am Start
- **15 Fragen pro Durchlauf**, gewichtet zufällig gezogen
  (3 leichte · 6 mittlere · 6 schwere) – jeder Durchlauf ist anders
- **Wertung aus richtigen Antworten + Schnelligkeit**
  (schwierigere Fragen geben mehr Punkte, schnelle Antworten einen kleinen Bonus)
- **Auflösung erst am Ende**: pro Frage richtige Antwort, eigene Wahl und Erklärung
- **Bestenliste** (Top-Platzierungen mit Punkten, Trefferquote, Zeit, Datum)
- ZWP-Design: helles Blau dezent als Akzent, viel Weiß – clean & professionell
- Responsive für Laptop und Tablet

## Starten

Es ist **kein Build-Schritt und keine Installation** nötig.

- **Einfachste Variante (Kiosk):** `index.html` im Browser öffnen (Doppelklick).
- **Empfohlen / mehrere Geräte im selben Netz:** Ordner über einen kleinen
  Webserver bereitstellen, z. B.:
  ```bash
  python3 -m http.server 8000
  ```
  und dann `http://<rechner-ip>:8000` aufrufen.
- Hosting auf **GitHub Pages** oder einem beliebigen Webserver funktioniert ebenfalls
  (alles statisch).

## Bestenliste

Die Bestenliste wird aktuell **lokal im Browser** gespeichert
(`localStorage`). Sie gilt also pro Gerät/Browser – ideal für einen
**Kiosk-Laptop oder ein Tablet** am Stand.

- **Zurücksetzen:** Auf dem Bestenlisten-Screen über
  „Bestenliste zurücksetzen" (für Stand-Betreuer).

### Geteilte Bestenliste später nachrüsten

Die Datenschicht ist bewusst gekapselt: `js/storage.js` stellt die async-API
`getLeaderboard()`, `saveScore()` und `clearLeaderboard()` bereit. Für eine
geräteübergreifende Bestenliste muss **nur diese Datei** auf ein Backend
(z. B. Supabase/Firebase oder ein kleines eigenes API) umgestellt werden – der
restliche Code bleibt unverändert.

## Fragen pflegen

Alle Fragen stehen in `js/questions.js`. Jede Frage hat:

```js
{
  id: 1,
  level: 'easy',          // 'easy' | 'medium' | 'hard'
  q: 'Fragetext …',
  options: ['…', '…', '…', '…'],
  correct: 1,             // Index der richtigen Antwort in options
  explanation: 'Kurze Begründung für die Auflösung.'
}
```

Antwortreihenfolge und Fragenauswahl werden zur Laufzeit gemischt.

## Projektstruktur

```
index.html            App-Gerüst (Start / Quiz / Ergebnis / Bestenliste)
css/styles.css        ZWP-Design
js/questions.js       Fragenkatalog (30 Fragen)
js/storage.js         Datenschicht (localStorage, Backend-tauglich gekapselt)
js/quiz.js            Quiz-Logik (Auswahl, Scoring, Zeit)
js/app.js             UI- und Ablaufsteuerung
assets/zwp-logo.svg   ZWP-Logo (Platzhalter – durch Originaldatei ersetzbar)
```

> **Logo:** `assets/zwp-logo.svg` ist eine nachgebaute Variante im ZWP-Look.
> Zum Einsetzen des Originals einfach die Datei ersetzen (gleicher Dateiname)
> oder den Pfad in `index.html` anpassen.
