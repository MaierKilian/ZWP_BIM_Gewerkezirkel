/**
 * Konfiguration ZWP BIM Quiz.
 *
 * Niederlassungen: Auswahl beim Start. Reihenfolge = Anzeigereihenfolge.
 * Zum Aendern/Ergaenzen einfach diese Liste anpassen.
 */
const NIEDERLASSUNGEN = [
  'Berlin',
  'Bochum',
  'Dresden',
  'Hamburg',
  'Köln',
  'München',
  'Erding',
  'Stuttgart'
];

if (typeof window !== 'undefined') {
  window.NIEDERLASSUNGEN = NIEDERLASSUNGEN;
}
