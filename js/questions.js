/**
 * Fragenkatalog ZWP BIM Quiz.
 *
 * Jede Frage:
 *   id          eindeutige Nummer
 *   level        'easy' | 'medium' | 'hard'
 *   q           Fragetext
 *   options     Array der Antwortmoeglichkeiten (in Ausgangsreihenfolge)
 *   correct     Index der richtigen Antwort in `options`
 *   explanation kurze Begruendung (wird in der Endauswertung gezeigt)
 *
 * Hinweis: Die Antwortreihenfolge wird zur Laufzeit gemischt, deshalb wird die
 * richtige Antwort ueber den Index in `options` referenziert (nicht ueber A/B/C/D).
 */
const QUESTIONS = [
  // ---------------------------------------------------------------- LEICHT
  {
    id: 1, level: 'easy',
    q: 'Was beschreibt BIM im Kern am besten?',
    options: [
      'Ein spezielles 3D-Zeichenprogramm',
      'Eine kooperative Arbeitsmethodik mit digitalen Bauwerksmodellen und Informationen',
      'Einen reinen Exportstandard für IFC-Dateien',
      'Eine automatische Kollisionsprüfung ohne Planungsprozess'
    ],
    correct: 1,
    explanation: 'BIM ist eine kooperative Arbeitsmethodik: digitale Bauwerksmodelle plus Informationen als Datenbasis für Planung, Ausführung und Betrieb – kein einzelnes Programm.'
  },
  {
    id: 2, level: 'easy',
    q: 'Wofür steht BAP im BIM-Kontext?',
    options: [
      'Bauablaufprüfung',
      'BIM-Ausführungsplan',
      'BIM-Projektabwicklungsplan',
      'Bauteil-Austausch-Protokoll'
    ],
    correct: 2,
    explanation: 'Der BAP (BIM-Projektabwicklungsplan) ist die verbindliche Grundlage der Zusammenarbeit und beschreibt Ziele, Rollen, Prozesse und Austauschanforderungen.'
  },
  {
    id: 3, level: 'easy',
    q: 'Was ist ein Fachmodell?',
    options: [
      'Ein Modell nur für die Architekturvisualisierung',
      'Ein gewerkspezifisches Modell eines Projektbeteiligten',
      'Ein Modell ohne Informationen, nur mit Geometrie',
      'Ein importiertes PDF mit 2D-Plänen'
    ],
    correct: 1,
    explanation: 'Ein Fachmodell ist das gewerkspezifische Modell eines Beteiligten (z. B. TGA). Mehrere Fachmodelle werden später zum Koordinationsmodell zusammengeführt.'
  },
  {
    id: 4, level: 'easy',
    q: 'Was entsteht, wenn mehrere Fachmodelle zur Abstimmung zusammengeführt werden?',
    options: [
      'Kollisionsliste',
      'Koordinationsmodell',
      'Raumbuch',
      'Leistungsverzeichnis'
    ],
    correct: 1,
    explanation: 'Das Zusammenführen der Fachmodelle ergibt das Koordinationsmodell – die Basis für Abstimmung und Kollisionsprüfung.'
  },
  {
    id: 5, level: 'easy',
    q: 'Welche Aussage passt am besten zum ZWP-Verständnis von BIM?',
    options: [
      'BIM ist nur sinnvoll, wenn der Auftraggeber es ausdrücklich fordert',
      'BIM ist bei ZWP vor allem Marketing und weniger Projektpraxis',
      'BIM ist bei ZWP eine fest etablierte Arbeitsmethodik im Planungsalltag',
      'BIM ersetzt alle Fachplaner durch automatische Modellierung'
    ],
    correct: 2,
    explanation: 'Bei ZWP ist BIM eine praxisorientierte, fest etablierte Arbeitsmethodik im Planungsalltag – Modelle als Datenbasis für Planung, Ausführung und Betrieb.'
  },
  {
    id: 6, level: 'easy',
    q: 'Was ist ein wesentlicher Nutzen der Kollisionsprüfung?',
    options: [
      'Sie ersetzt die technische Berechnung vollständig',
      'Sie erkennt räumliche Überschneidungen zwischen Modellen frühzeitig',
      'Sie erzeugt automatisch alle Ausführungspläne',
      'Sie verhindert, dass Modelle Informationen enthalten'
    ],
    correct: 1,
    explanation: 'Die Kollisionsprüfung erkennt räumliche Konflikte zwischen Fachmodellen frühzeitig, damit sie vor Baubeginn systematisch beseitigt werden können.'
  },
  {
    id: 7, level: 'easy',
    q: 'Wofür wird IFC typischerweise verwendet?',
    options: [
      'Für den offenen Austausch modellbasierter Daten zwischen Programmen',
      'Für die Erstellung von Papierplänen',
      'Für die automatische Dimensionierung von Pumpen',
      'Für die interne E-Mail-Kommunikation'
    ],
    correct: 0,
    explanation: 'IFC ist ein offenes Format für den softwareübergreifenden Austausch modellbasierter Daten (Open BIM).'
  },
  {
    id: 8, level: 'easy',
    q: 'Was bedeutet „Single Source of Truth" im BIM-Kontext am ehesten?',
    options: [
      'Alle Projektbeteiligten arbeiten ausschließlich in einer Software',
      'Informationen werden möglichst zentral und konsistent im Modell gepflegt',
      'Es gibt nur einen Projektleiter',
      'Jede Änderung wird nur per PDF dokumentiert'
    ],
    correct: 1,
    explanation: 'Single Source of Truth heißt: Informationen werden zentral und konsistent im Modell gepflegt, sodass alle auf denselben aktuellen Datenstand zugreifen.'
  },
  {
    id: 9, level: 'easy',
    q: 'Welche Aussage zur ZWP-Revit-Projektvorlage ist richtig?',
    options: [
      'Sie enthält alle projektspezifischen Parameter und 3D-Gewerkefamilien automatisch',
      'Sie enthält u. a. Projektparameter, Bauteillisten, Systemfamilien, IFC-/DWG-Einstellungen und liNear-Verknüpfungen',
      'Sie ersetzt den BAP vollständig',
      'Sie ist nur für Architekturmodelle vorgesehen'
    ],
    correct: 1,
    explanation: 'Die ZWP-Vorlage liefert u. a. Projektparameter, Bauteillisten, Systemfamilien, IFC-/DWG-Einstellungen und liNear-Verknüpfungen – aber bewusst keine projektspezifischen Parameter und keine 3D-Gewerkefamilien.'
  },
  {
    id: 10, level: 'easy',
    q: 'Wofür dient Dynamo in Revit laut ZWP-Unterlagen grundsätzlich?',
    options: [
      'Nur zum Rendern von fotorealistischen Bildern',
      'Zum Erstellen maßgeschneiderter Automatisierungen und Workflows',
      'Ausschließlich zur Kollisionsprüfung in Navisworks',
      'Zur Verwaltung von E-Mail-Verteilern'
    ],
    correct: 1,
    explanation: 'Dynamo dient zur visuellen Programmierung – also zum Erstellen maßgeschneiderter Automatisierungen und Workflows in Revit.'
  },

  // --------------------------------------------------------------- MITTEL
  {
    id: 11, level: 'medium',
    q: 'Warum ist ein BAP in einem BIM-Projekt besonders wichtig?',
    options: [
      'Weil er alle Planungsentscheidungen automatisch trifft',
      'Weil er Ziele, Rollen, Prozesse, Austauschanforderungen und Verantwortlichkeiten verbindlich beschreibt',
      'Weil er ausschließlich die Revit-Version festlegt',
      'Weil er nur als Marketingdokument für den Bauherrn dient'
    ],
    correct: 1,
    explanation: 'Der BAP schafft Verbindlichkeit: Ziele, Rollen, Prozesse, Austauschanforderungen und Verantwortlichkeiten werden klar geregelt – Grundlage der Zusammenarbeit.'
  },
  {
    id: 12, level: 'medium',
    q: 'Welche Kombination beschreibt einen sinnvollen BIM-Mehrwert in der TGA am besten?',
    options: [
      '3D-Darstellung ohne Attribute, keine Berechnung, keine Auswertung',
      'Modellierung, Berechnung, Koordination, Mengenermittlung und Informationspflege im Modell',
      'Nur Planlayout und PDF-Ausgabe',
      'Ausschließlich Architekturvisualisierung'
    ],
    correct: 1,
    explanation: 'BIM-Mehrwert in der TGA entsteht aus dem Zusammenspiel: Modellierung, Berechnung, Koordination, Mengenermittlung und gepflegte Informationen im Modell.'
  },
  {
    id: 13, level: 'medium',
    q: 'Warum ist frühe Abstimmung der Informationsanforderungen im BIM-Projekt entscheidend?',
    options: [
      'Weil spätere Attribute und Exportanforderungen sonst möglicherweise nicht in der Modellstruktur angelegt sind',
      'Weil dadurch keine Kollisionsprüfung mehr erforderlich ist',
      'Weil IFC-Dateien dadurch überflüssig werden',
      'Weil Modelle dann nicht mehr geändert werden dürfen'
    ],
    correct: 0,
    explanation: 'Werden Informationsanforderungen zu spät geklärt, fehlen später Attribute/Strukturen im Modell – das nachträgliche Ergänzen ist aufwendig und fehleranfällig.'
  },
  {
    id: 14, level: 'medium',
    q: 'Was ist bei ZWP ein typischer Vorteil modellbasierter SuD-Planung?',
    options: [
      'Durchbrüche können mit Freigabestatus, Nummerierung und Kommentaren modellbasiert abgestimmt werden',
      'SuD-Angaben müssen nicht mehr mit Architektur und Tragwerk abgestimmt werden',
      'Der BIM-Koordinator wird dadurch überflüssig',
      'SuD-Planung erfolgt grundsätzlich ohne Eigenschaften'
    ],
    correct: 0,
    explanation: 'Modellbasierte Schlitz- und Durchbruchsplanung (SuD) erlaubt die Abstimmung über Freigabestatus, Nummerierung und Kommentare – nachvollziehbar zwischen den Gewerken.'
  },
  {
    id: 15, level: 'medium',
    q: 'Warum ist die Objekt-ID im SuD-Workflow kritisch?',
    options: [
      'Sie ersetzt die IFC-Datei',
      'Sie dient als Schlüssel, um Rückmeldungen aus Listen wieder dem richtigen Durchbruch zuzuordnen',
      'Sie wird nur für Farben im Plan verwendet',
      'Sie darf nach Belieben geändert werden, solange der Kommentar gleich bleibt'
    ],
    correct: 1,
    explanation: 'Die Objekt-ID ist der eindeutige Schlüssel: Nur darüber lassen sich Rückläufer aus Excel-/IFC-Listen wieder dem richtigen Durchbruch im Modell zuordnen.'
  },
  {
    id: 16, level: 'medium',
    q: 'Welche Aussage zu Open BIM und Closed BIM ist am sinnvollsten?',
    options: [
      'Open BIM ist immer besser als Closed BIM',
      'Closed BIM ist immer fehlerfrei',
      'Beide Ansätze haben Vor- und Nachteile; der Einsatz wird projektspezifisch entschieden',
      'Bei ZWP wird grundsätzlich nur mit PDF gearbeitet'
    ],
    correct: 2,
    explanation: 'Open und Closed BIM haben jeweils Vor- und Nachteile. Welcher Ansatz passt, wird projektspezifisch entschieden.'
  },
  {
    id: 17, level: 'medium',
    q: 'Was ist ein typischer Nachteil von Closed BIM in einer einheitlichen Softwareumgebung?',
    options: [
      'Es kann keine direkte Anpassung in einer Software geben',
      'Schnittstellenverluste sind zwingend höher als bei Open BIM',
      'Die Software muss von den Beteiligten auf hohem Niveau beherrscht werden',
      'Es gibt keine Möglichkeit, Durchbrüche zu modellieren'
    ],
    correct: 2,
    explanation: 'Closed BIM setzt voraus, dass alle Beteiligten dieselbe Software auf hohem Niveau beherrschen – sonst leidet die Zusammenarbeit.'
  },
  {
    id: 18, level: 'medium',
    q: 'Warum ist der Parameterworkflow im BIM-TGA-Kontext so relevant?',
    options: [
      'Weil Parameter nur für grafische Farben im Plan gebraucht werden',
      'Weil Raum-, Bauteil-, Berechnungs- und Betriebsinformationen auswertbar und weiterverwendbar werden',
      'Weil Parameter alle Planungsentscheidungen automatisch ersetzen',
      'Weil Parameter in IFC nicht übertragen werden können'
    ],
    correct: 1,
    explanation: 'Parameter machen Raum-, Bauteil-, Berechnungs- und Betriebsinformationen auswertbar und weiterverwendbar – die Grundlage für Mengen, QS, BIM2FM usw.'
  },
  {
    id: 19, level: 'medium',
    q: 'Welche Aussage zur ZWP-APP / Automatisierung passt am besten?',
    options: [
      'Die ZWP-APP dient dazu, komplexe Revit- und Workflow-Aufgaben zu vereinfachen',
      'Die ZWP-APP ersetzt jede Modellprüfung vollständig',
      'Die ZWP-APP ist ausschließlich für Architekturgrundrisse vorgesehen',
      'Die ZWP-APP verhindert die Nutzung von Dynamo'
    ],
    correct: 0,
    explanation: 'Die ZWP-APP bündelt Automatisierungen, um komplexe Revit- und Workflow-Aufgaben zu vereinfachen – ergänzend zu Dynamo, nicht als Ersatz für Prüfungen.'
  },
  {
    id: 20, level: 'medium',
    q: 'Welche Rolle spielt das Revit-Raummodell im ZWP-Kontext am ehesten?',
    options: [
      'Es ist nur ein grafischer Hintergrund ohne Berechnungsbezug',
      'Es erfasst Räume und Einstellungen für Lastberechnungen',
      'Es ersetzt alle Gewerkemodelle',
      'Es dient ausschließlich zur Möblierung'
    ],
    correct: 1,
    explanation: 'Das Raummodell erfasst Räume und zugehörige Einstellungen und liefert damit die Basis für Lastberechnungen (Heiz-/Kühllast etc.).'
  },

  // ---------------------------------------------------------------- SCHWER
  {
    id: 21, level: 'hard',
    q: 'Der Bauherr fordert „BIM2FM", nennt aber keine konkreten Datenanforderungen. Was ist fachlich der beste nächste Schritt?',
    options: [
      'Möglichst viele Parameter ungeprüft ins Modell schreiben',
      'Zunächst Betriebsziele, Use Cases und benötigte Datenpunkte definieren und daraus Informationsanforderungen ableiten',
      'Nur ein 3D-Modell ohne Attribute liefern',
      'BIM2FM ablehnen, weil es in TGA-Projekten nicht relevant ist'
    ],
    correct: 1,
    explanation: 'Ohne definierte Datenanforderungen zuerst Betriebsziele und Use Cases klären, daraus die benötigten Datenpunkte und Informationsanforderungen ableiten – sonst werden Daten am Bedarf vorbei gepflegt.'
  },
  {
    id: 22, level: 'hard',
    q: 'In LPH 3 wird ein TGA-Modell erstellt. Welche Aussage passt am besten zur sinnvollen Modellierung nach BIM-TGA-Verständnis?',
    options: [
      'Alle Kabel, Schalter und Dosen müssen immer lagegenau modelliert werden',
      'Raumbestimmende Haupttrassen, Kanäle, Rohre, Elektrotrassen und wesentliche Komponenten sollten mit relevanten Informationen abgebildet werden',
      'Es dürfen nur 2D-Symbole verwendet werden',
      'Berechnungsergebnisse dürfen nie im Modell enthalten sein'
    ],
    correct: 1,
    explanation: 'In LPH 3 stehen raumbestimmende Hauptdimensionen und wesentliche Komponenten mit relevanten Informationen im Fokus – nicht jede Dose lagegenau. Der Detailgrad steigt erst in späteren Phasen.'
  },
  {
    id: 23, level: 'hard',
    q: 'Ein Projektteam möchte die Kollisionsprüfung erst kurz vor Baubeginn durchführen. Welche Bewertung ist am treffendsten?',
    options: [
      'Das ist ideal, weil dann alle Planungen fertig sind',
      'Das widerspricht dem Ziel, Planungskonflikte frühzeitig systematisch zu erkennen und zu beseitigen',
      'Das ist nur bei Elektroplanung problematisch',
      'Kollisionsprüfungen sind unabhängig vom Zeitpunkt immer gleich wirksam'
    ],
    correct: 1,
    explanation: 'Kollisionsprüfungen gehören iterativ in die Planung (z. B. Ende LP3 sowie Mitte/Ende LP5). Erst kurz vor Baubeginn ist zu spät, um Konflikte wirtschaftlich zu lösen.'
  },
  {
    id: 24, level: 'hard',
    q: 'Warum reicht ein „schönes 3D-Modell" allein nicht aus, um BIM-Qualität sicherzustellen?',
    options: [
      'Weil BIM nur aus Planableitung besteht',
      'Weil BIM neben Geometrie auch Prozesse, Rollen, Informationsanforderungen, Modellqualität und Auswertbarkeit benötigt',
      'Weil 3D-Modelle grundsätzlich nicht koordiniert werden können',
      'Weil BIM ohne VR-Brille nicht funktioniert'
    ],
    correct: 1,
    explanation: 'BIM ist mehr als Geometrie: Prozesse, Rollen, Informationsanforderungen, Modellqualität und Auswertbarkeit machen erst die eigentliche Qualität aus.'
  },
  {
    id: 25, level: 'hard',
    q: 'Ein Team modelliert Bauteile geometrisch sehr detailliert, pflegt aber keine System- oder Leistungsinformationen. Was ist das Hauptproblem?',
    options: [
      'Das Modell ist wahrscheinlich optisch gut, aber für Auswertung, Berechnung, Betrieb und Koordination nur eingeschränkt nutzbar',
      'Das Modell ist automatisch besser als ein weniger detailliertes Modell',
      'Das Modell erfüllt automatisch alle BIM2FM-Anforderungen',
      'Detaillierte Geometrie ersetzt alle Attribute'
    ],
    correct: 0,
    explanation: 'Ohne System-/Leistungsinformationen bleibt das Modell ein hübsches Bild: Für Auswertung, Berechnung, Betrieb und Koordination ist es nur eingeschränkt nutzbar.'
  },
  {
    id: 26, level: 'hard',
    q: 'Warum kann modellbasierte Mengenermittlung in der TGA anspruchsvoll sein?',
    options: [
      'Weil Mengen grundsätzlich nicht aus Modellen abgeleitet werden können',
      'Weil Modellstruktur, Autorensoftware, Klassifikation, Bauteileigenschaften und Exportqualität zusammenpassen müssen',
      'Weil Mengenermittlung nur in Excel möglich ist',
      'Weil IFC keine Informationen enthalten kann'
    ],
    correct: 1,
    explanation: 'Verlässliche Mengen entstehen nur, wenn Modellstruktur, Autorensoftware, Klassifikation, Bauteileigenschaften und Exportqualität sauber zusammenspielen.'
  },
  {
    id: 27, level: 'hard',
    q: 'IFC-Modell und Excel-Liste werden im SuD-Prozess mehrfach zwischen ZWP, ARC und TWP ausgetauscht. Welche QS-Maßnahme ist besonders wichtig?',
    options: [
      'Rückläufer ungeprüft importieren, um Zeit zu sparen',
      'Kommentare, IDs und doppelte Objekt-IDs prüfen, bevor Daten übernommen werden',
      'Alle Durchbrüche nach jedem Austausch löschen und neu modellieren',
      'Nur die PDF-Pläne beachten'
    ],
    correct: 1,
    explanation: 'Beim mehrfachen Austausch sind Kommentare, IDs und vor allem doppelte Objekt-IDs zu prüfen, bevor Daten übernommen werden – sonst gehen Zuordnungen verloren.'
  },
  {
    id: 28, level: 'hard',
    q: 'Warum ist GA × BIM komplexer als reine TGA-Modellkoordination?',
    options: [
      'Weil Gebäudeautomation keine Datenpunkte benötigt',
      'Weil neben Modellgeometrie auch Datenpunkte, BAS/AKS, Raum-/Anlagenzuordnung, Betriebsszenarien und Schnittstellen zum Monitoring relevant werden',
      'Weil GA grundsätzlich nicht modellierbar ist',
      'Weil GA nur aus 2D-Schemata besteht'
    ],
    correct: 1,
    explanation: 'Bei GA × BIM kommen zur Geometrie noch Datenpunkte, BAS/AKS, Raum-/Anlagenzuordnung, Betriebsszenarien und Monitoring-Schnittstellen hinzu – deutlich vielschichtiger.'
  },
  {
    id: 29, level: 'hard',
    q: 'Welche Aussage beschreibt einen hohen BIM-Reifegrad in einem TGA-Projekt am besten?',
    options: [
      'Das Modell sieht gut aus, wird aber nach der Planabgabe nicht weiter genutzt',
      'Das Modell wird als konsistente Datenbasis für Koordination, Berechnung, Qualitätssicherung, Mengen, Kosten, Ausführung und Betrieb genutzt',
      'Das Modell wird ausschließlich für Renderings erstellt',
      'BIM wird nur in LPH 8 auf der Baustelle begonnen'
    ],
    correct: 1,
    explanation: 'Hoher Reifegrad heißt: Das Modell ist durchgängige Datenbasis – für Koordination, Berechnung, QS, Mengen, Kosten, Ausführung und Betrieb.'
  },
  {
    id: 30, level: 'hard',
    q: 'Ein Projekt entscheidet sich für Closed BIM in Revit. Welche strategische Frage sollte vor Projektstart zwingend geklärt werden?',
    options: [
      'Ob alle Beteiligten dieselbe Schriftart verwenden',
      'Ob alle relevanten Beteiligten die Software, Modellierungsregeln, Berechnungs-/Schnittstellenprozesse und Verantwortlichkeiten ausreichend beherrschen und akzeptieren',
      'Ob IFC vollständig vermieden werden kann',
      'Ob 2D-Pläne entfallen dürfen'
    ],
    correct: 1,
    explanation: 'Closed BIM funktioniert nur, wenn alle Beteiligten Software, Modellierungsregeln, Berechnungs-/Schnittstellenprozesse und Verantwortlichkeiten beherrschen und akzeptieren.'
  },

  // ============================================================ WAHR / FALSCH
  {
    id: 31, level: 'easy', type: 'truefalse',
    q: 'Wahr oder falsch? BIM ist ein einzelnes Software-Programm.',
    answer: false,
    explanation: 'Falsch. BIM ist eine kooperative Arbeitsmethodik mit digitalen Modellen und Informationen – nicht ein bestimmtes Programm.'
  },
  {
    id: 32, level: 'easy', type: 'truefalse',
    q: 'Wahr oder falsch? Der BAP (BIM-Projektabwicklungsplan) regelt die Zusammenarbeit im BIM-Projekt.',
    answer: true,
    explanation: 'Wahr. Der BAP ist die verbindliche Grundlage der Zusammenarbeit: Ziele, Rollen, Prozesse und Austauschanforderungen.'
  },
  {
    id: 33, level: 'medium', type: 'truefalse',
    q: 'Wahr oder falsch? Open BIM ist grundsätzlich immer besser als Closed BIM.',
    answer: false,
    explanation: 'Falsch. Beide Ansätze haben Vor- und Nachteile – der Einsatz wird projektspezifisch entschieden.'
  },
  {
    id: 34, level: 'hard', type: 'truefalse',
    q: 'Wahr oder falsch? Eine Kollisionsprüfung ist nur sinnvoll, wenn sie einmalig kurz vor Baubeginn durchgeführt wird.',
    answer: false,
    explanation: 'Falsch. Kollisionsprüfungen gehören iterativ in die Planung (z. B. Ende LP3 sowie Mitte/Ende LP5), um Konflikte früh und wirtschaftlich zu lösen.'
  },

  // ============================================================ REIHENFOLGE
  {
    id: 35, level: 'medium', type: 'order',
    q: 'Bring die Schritte der modellbasierten Koordination in die richtige Reihenfolge.',
    items: [
      'Fachmodelle der Gewerke erstellen',
      'Fachmodelle zum Koordinationsmodell zusammenführen',
      'Kollisionsprüfung durchführen',
      'Konflikte abstimmen und beheben'
    ],
    explanation: 'Erst entstehen die Fachmodelle, dann das Koordinationsmodell, darauf folgt die Kollisionsprüfung und zuletzt das Beheben der Konflikte.'
  },
  {
    id: 36, level: 'hard', type: 'order',
    q: 'Ordne die ZWP-Kollisionskontrollen nach Zeitpunkt (zuerst → zuletzt).',
    items: [
      'Ende Leistungsphase 3',
      'Mitte Leistungsphase 5',
      'Ende Leistungsphase 5'
    ],
    explanation: 'Bei ZWP sind Kollisionskontrollen am Ende LP3 sowie in der Mitte und am Ende LP5 vorgesehen – iterativ über die Planung verteilt.'
  },
  {
    id: 37, level: 'hard', type: 'order',
    q: 'Bring den BIM-Datennutzen über den Lebenszyklus in die übliche Reihenfolge (früh → spät).',
    items: [
      'Planung & Koordination (Modellaufbau, Kollisionsprüfung)',
      'Mengen & Kosten aus dem Modell',
      'BIM2Field – Modelldaten auf der Baustelle',
      'BIM2FM – Daten für den Betrieb'
    ],
    explanation: 'Der Modellnutzen wächst über den Lebenszyklus: von Planung/Koordination über Mengen/Kosten zur Ausführung (BIM2Field) bis in den Betrieb (BIM2FM).'
  },

  // ============================================================ ZUORDNEN
  {
    id: 38, level: 'medium', type: 'match',
    q: 'Ordne jeder Abkürzung die richtige Bedeutung zu.',
    pairs: [
      { left: 'BAP', right: 'BIM-Projektabwicklungsplan' },
      { left: 'IFC', right: 'Offenes Austauschformat für Modelldaten' },
      { left: 'SuD', right: 'Schlitz- und Durchbruchsplanung' },
      { left: 'LOD', right: 'Detaillierungsgrad eines Bauteils' }
    ],
    explanation: 'BAP = BIM-Projektabwicklungsplan, IFC = offenes Austauschformat, SuD = Schlitz- und Durchbruchsplanung, LOD = Detaillierungsgrad (Level of Development/Detail).'
  },
  {
    id: 39, level: 'hard', type: 'match',
    q: 'Ordne jeder BIM-Rolle ihre Hauptaufgabe zu.',
    pairs: [
      { left: 'BIM-Manager', right: 'Prozesse & Vorgaben projektübergreifend steuern' },
      { left: 'BIM-Gesamtkoordinator', right: 'Fachmodelle gewerkeübergreifend zusammenführen' },
      { left: 'BIM-Koordinator', right: 'Qualität des eigenen Fachmodells verantworten' },
      { left: 'BIM-Autor', right: 'Modell fachlich erstellen und pflegen' }
    ],
    explanation: 'Der BIM-Manager steuert Prozesse/Vorgaben, der Gesamtkoordinator führt die Fachmodelle zusammen, der Koordinator verantwortet das Fachmodell, der Autor modelliert.'
  },
  {
    id: 40, level: 'hard', type: 'match',
    q: 'Ordne jedem BIM-Anwendungsfall die passende Beschreibung zu.',
    pairs: [
      { left: 'Kollisionsprüfung', right: 'Räumliche Konflikte zwischen Modellen erkennen' },
      { left: 'Mengenermittlung', right: 'Mengen modellbasiert aus Bauteilen ableiten' },
      { left: 'BIM2Field', right: 'Modelldaten für die Ausführung auf der Baustelle' },
      { left: 'BIM2FM', right: 'Modelldaten für den späteren Gebäudebetrieb' }
    ],
    explanation: 'Kollisionsprüfung = Konflikte erkennen, Mengenermittlung = Mengen aus dem Modell, BIM2Field = Daten auf der Baustelle, BIM2FM = Daten für den Betrieb.'
  }
];

// Export für Browser (global) – kein Build-Step nötig.
if (typeof window !== 'undefined') {
  window.QUESTIONS = QUESTIONS;
}
