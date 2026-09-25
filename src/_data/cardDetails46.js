// Editorial data only. Plain text is escaped by the shared Nunjucks renderer.
// Reused topics have an explicit occurrence key: route / group / stable card id.
const copy = {
  variants: [
    "Quando un prodotto cambia per dimensioni, materiali e accessori, un elenco non basta.",
    "Un percorso di configurazione può organizzare le alternative e mostrare soltanto quelle pertinenti alla scelta in corso.",
    "Per esempio, una finitura può essere disponibile solo per alcune strutture: le regole vengono definite sul catalogo reale, distinguendo opzioni disponibili e casi da verificare.",
  ],
  quotes: [
    "Un sistema di preventivazione può raccogliere la configurazione e applicare un listino unico, evitando di ricostruire ogni proposta da fogli, email e documenti separati.",
    "Il risultato può diventare una bozza di offerta da verificare.",
    "Sconti, eccezioni e approvazioni restano quelli previsti dal processo aziendale, non decisioni automatiche introdotte dal software.",
  ],
  rules: [
    "Le dipendenze tra opzioni possono essere rese esplicite mentre il cliente o il commerciale configura il prodotto.",
    "Il sistema può guidare verso alternative compatibili o spiegare perché una scelta non è disponibile.",
    "Per esempio, un accessorio può richiedere una particolare base o una misura minima: servono regole tecniche formalizzabili e una gestione distinta delle eccezioni.",
  ],
  network: [
    "Un portale può offrire alla rete vendita un punto comune per cataloghi, configurazioni e documenti, rispettando visibilità e autonomia dei diversi ruoli.",
    "Un agente può preparare una proposta mentre un responsabile ne verifica le condizioni.",
    "Listini e condizioni devono avere una fonte attendibile: il progetto definisce chi li aggiorna e come gestire le eccezioni.",
  ],
  combinations: [
    "Materiali, colori e componenti possono essere organizzati in una sequenza che mostra il prodotto e rende confrontabili le alternative.",
    "Si parte dalle varianti effettivamente vendibili: non ogni combinazione matematica corrisponde a un articolo disponibile.",
    "Per esempio, si può scegliere prima il modello e poi proporre soltanto gli accessori compatibili con quella famiglia.",
  ],
  dependencies: [
    "Alcune opzioni cambiano ciò che è possibile selezionare dopo.",
    "Il configuratore può abilitare, rendere obbligatorie o escludere scelte in base a quelle già effettuate.",
    "La logica può riguardare misure, materiali, componenti o lavorazioni.",
    "Se si cambia una scelta iniziale, occorre spiegare quali opzioni successive restano valide, senza perdere silenziosamente le decisioni dell’utente.",
  ],
  pricing: [
    "Il prezzo può aggiornarsi quando si cambiano modello, materiale o accessori.",
    "Una spiegazione sintetica delle voci aiuta a distinguere il prodotto base dalle personalizzazioni.",
    "Il progetto stabilisce quale listino utilizzare, la validità degli importi e quali condizioni mostrare al pubblico o alla rete commerciale.",
    "I casi fuori listino possono richiedere una verifica prima dell’offerta.",
  ],
  order: [
    "La configurazione può essere accompagnata da un riepilogo delle scelte e dei dati necessari all’ordine, così le informazioni non devono essere ricostruite da una nota libera.",
    "Il passaggio al carrello o al gestionale viene progettato sulle interfacce realmente disponibili.",
    "Prima del trasferimento vanno definiti codici, quantità, controlli e comportamento quando una variante non è più disponibile.",
  ],
  roles: [
    "Utenti diversi possono avere accesso a cataloghi, condizioni e azioni differenti.",
    "Un portale può separare ciò che un agente consulta da ciò che un responsabile modifica o approva.",
    "I ruoli vengono definiti sul processo: nascondere un pulsante non sostituisce il controllo degli accessi sul server.",
    "Anche documenti, configurazioni condivise e operazioni consentite devono rispettare queste decisioni.",
  ],
  saves: [
    "Una configurazione può essere salvata e ripresa, oppure duplicata per preparare una variante senza perdere l’originale.",
    "Questo permette di confrontare alternative e gestire richieste successive.",
    "Il progetto stabilisce quali dati conservare, chi può recuperarli e come comportarsi quando il catalogo o il listino cambiano.",
    "Un link condiviso non deve rendere pubbliche informazioni riservate.",
  ],
  revisions: [
    "Le versioni di una proposta possono essere mantenute distinguibili, con stato, data e collegamento alla configurazione di partenza.",
    "Il confronto può aiutare a ricostruire cosa è cambiato, per esempio un materiale o una quantità.",
    "Regole di approvazione e storicizzazione vengono definite prima dello sviluppo, distinguendo una bozza modificabile dalla versione effettivamente verificata.",
  ],
  pdf: [
    "Il riepilogo può raccogliere articoli, quantità, condizioni e immagini della configurazione in un documento coerente con l’offerta.",
    "I campi e le lingue dipendono dal progetto.",
    "L’esportazione del documento non equivale automaticamente a invio, firma o conferma d’ordine: questi passaggi devono restare separati e richiedere le verifiche previste dal processo commerciale.",
  ],
  imports: [
    "Cataloghi e listini possono essere acquisiti da file strutturati o da sistemi collegati, con controlli sui campi obbligatori e sulla corrispondenza dei codici.",
    "Un’importazione può segnalare righe incomplete prima dell’aggiornamento.",
    "Formati, frequenza, responsabilità e gestione degli errori vengono concordati sulle fonti effettive; un file nuovo non deve sovrascrivere indiscriminatamente informazioni già verificate.",
  ],
  dashboard: [
    "Una vista operativa può raccogliere configurazioni, stati e informazioni utili a chi lavora sulle proposte.",
    "Per esempio, può distinguere le bozze da completare dalle richieste in attesa di verifica.",
    "Mostrare molti grafici non è l’obiettivo: si scelgono le informazioni che aiutano davvero a decidere il prossimo passo, secondo dati disponibili e permessi del ruolo.",
  ],
  documents: [
    "Schede tecniche, allegati e documenti commerciali possono essere organizzati vicino alla configurazione a cui si riferiscono.",
    "Si può così consultare il materiale pertinente senza ricostruire ogni volta il collegamento con il prodotto.",
    "Versioni, permessi e origine dei file devono essere definiti; il portale non sostituisce automaticamente ogni archivio aziendale né garantisce che una copia sia aggiornata.",
  ],
  integrations: [
    "Il configuratore può scambiare informazioni con cataloghi, CRM, e-commerce o gestionali quando API, formati e autorizzazioni lo consentono.",
    "L’analisi chiarisce quali dati trasferire, quale sistema ne è responsabile e come gestire errori e duplicazioni.",
    "Per esempio, un catalogo può essere letto dal gestionale mentre la configurazione resta una bozza fino alla verifica commerciale.",
  ],
  modular: [
    "Un planner può aiutare a disporre elementi e accessori rispettando le relazioni tra i moduli.",
    "La rappresentazione rende leggibili dimensioni, finiture e risultato della composizione.",
    "Il perimetro parte da famiglie di prodotto e regole realmente definite, non da un arredatore generico.",
    "Per esempio, due elementi adiacenti possono richiedere un raccordo o una finitura compatibile.",
  ],
  dimensions: [
    "Limiti dimensionali, ingombri e incompatibilità possono essere controllati durante la configurazione, prima della preparazione dell’offerta.",
    "Si distinguono regole automatiche e casi che richiedono una verifica tecnica: il software non deve fingere di risolvere un vincolo non modellato.",
    "Una misura fuori intervallo può quindi essere segnalata e affidata al referente tecnico, senza presentarla come soluzione valida.",
  ],
  catalog: [
    "Famiglie e articoli possono essere organizzati per rendere più facile trovare il componente pertinente, senza mostrare contemporaneamente tutte le possibilità.",
    "Categorie, immagini, codici e filtri sono progettati a partire dalla struttura reale del catalogo.",
    "Prima di aggiungere un filtro occorre verificare che il dato esista e sia mantenibile anche quando vengono introdotti nuovi articoli.",
  ],
  finishes: [
    "Una finitura può essere associata a determinate parti, materiali o famiglie del catalogo.",
    "Il planner può rendere visibili le alternative ammesse e aggiornare la rappresentazione della composizione.",
    "Fotografie e texture aiutano il confronto, ma non sostituiscono un campione fisico: disponibilità, abbinamenti e limiti di resa vanno concordati sul prodotto realmente venduto.",
  ],
  visual: [
    "La rappresentazione va scelta in base alla decisione da aiutare.",
    "Una vista 2D può chiarire misure e disposizione; un modello 3D può rendere leggibili volume, finiture e dettagli.",
    "La realtà aumentata può aggiungere il contesto dell’ambiente sui dispositivi compatibili.",
    "Asset, peso, qualità e prove sui dispositivi previsti fanno parte della valutazione, non sono un risultato automatico.",
  ],
  spaces: [
    "Quando l’ambiente influisce sulla composizione, il planner può raccogliere dimensioni e riferimenti utili al posizionamento.",
    "Si può confrontare l’ingombro di una soluzione con lo spazio dichiarato dall’utente.",
    "Il progetto deve distinguere una rappresentazione orientativa da una verifica tecnica, chiarendo quali misure sono richieste e quali vincoli restano da controllare prima dell’ordine.",
  ],
  ecommerce: [
    "Un percorso e-commerce può partire dal modello, proporre materiali e accessori compatibili e accompagnare l’utente a un riepilogo comprensibile.",
    "La configurazione deve poi corrispondere ai dati che lo store sa gestire.",
    "Catalogo, prezzi, disponibilità e checkout vengono verificati sulla piattaforma esistente: la parte visuale non implica da sola un’integrazione completa con gli ordini.",
  ],
  cpq: [
    "Quando una proposta dipende da regole e condizioni commerciali, un CPQ può collegare configurazione, calcolo e documento in un percorso verificabile.",
    "Un portale può affiancarlo con accessi per la rete vendita e archivio delle proposte.",
    "Moduli e autorizzazioni vengono scelti sul processo reale, senza aggiungere funzioni soltanto perché presenti in un pacchetto standard.",
  ],
  planner: [
    "Per un catalogo modulare si può partire da una famiglia, scegliere elementi compatibili e confrontare finiture e ingombri prima della proposta.",
    "Il risultato può alimentare un riepilogo di articoli e quantità.",
    "Serve una mappa attendibile di prodotti, accessori e vincoli: non si promette un planner capace di comporre qualsiasi ambiente o catalogo senza preparazione.",
  ],
  ai: [
    "Un’automazione AI può affiancare un passaggio circoscritto, per esempio ordinare richieste o preparare una bozza a partire da documenti autorizzati.",
    "Prima si definiscono input, output e responsabilità della verifica.",
    "I casi incerti devono avere un percorso esplicito verso una persona; collegare più strumenti non autorizza automaticamente l’invio di offerte o la modifica di dati aziendali.",
  ],
  extraction: [
    "L’AI può aiutare a individuare campi, righe e informazioni nei documenti, preparandoli per una verifica e per il successivo utilizzo.",
    "Qualità dei file, formati e controlli sulle risposte determinano cosa è automatizzabile e cosa deve essere rivisto.",
    "Per esempio, un codice estratto da un PDF può essere confrontato con il catalogo prima di alimentare una proposta.",
  ],
  classification: [
    "Messaggi e richieste possono essere raggruppati secondo categorie e priorità utili al processo, con gestione separata dei casi incerti.",
    "Per esempio, si può distinguere una richiesta di preventivo da una domanda tecnica.",
    "Le categorie vengono concordate e verificate su esempi autorizzati; una classificazione dubbia non deve decidere autonomamente l’esito commerciale della richiesta.",
  ],
  drafts: [
    "L’AI può preparare una prima versione usando informazioni strutturate e modelli autorizzati, lasciando la verifica delle parti commerciali a chi ne ha la responsabilità.",
    "Una bozza non viene presentata come un’offerta approvata.",
    "Si definiscono contenuti ammessi, dati da controllare e passaggi prima dell’invio, mantenendo riconoscibili le informazioni mancanti invece di completarle con ipotesi.",
  ],
  assistance: [
    "Informazioni e documenti pertinenti possono essere resi disponibili mentre l’utente gestisce una configurazione o una richiesta.",
    "Per esempio, una scheda tecnica può aiutare a chiarire una compatibilità senza uscire dal flusso.",
    "L’assistenza deve rispettare i permessi e indicare quando le fonti non consentono una risposta attendibile, lasciando la verifica al referente competente.",
  ],
  transfer: [
    "I dati raccolti in una richiesta possono passare al sistema che gestisce il lavoro successivo, evitando trascrizioni dove le interfacce consentono un collegamento.",
    "Mapping dei campi, duplicati, stati e responsabilità devono essere definiti prima di automatizzare il trasferimento.",
    "Un recapito mancante o un dato incoerente può richiedere un controllo, senza generare invii o aggiornamenti indiscriminati.",
  ],
  workflow: [
    "Un’automazione può segnalare dati mancanti, incoerenze o passaggi che richiedono attenzione prima di proseguire.",
    "Le regole certe possono essere deterministiche; l’AI viene usata solo dove aggiunge valore e con una gestione esplicita dell’incertezza.",
    "Per esempio, una richiesta priva di codice prodotto può restare in verifica invece di essere associata a un articolo ipotizzato.",
  ],
  search: [
    "Un assistente può aiutare a trovare informazioni in un insieme di fonti aziendali autorizzate, mantenendo il collegamento con i documenti consultati.",
    "Aggiornamento delle fonti, permessi e risposta in caso di informazione assente sono parte del progetto.",
    "Una procedura superata deve essere distinguibile da quella corrente; una fonte non disponibile non va sostituita con una risposta inventata.",
  ],
  assistants: [
    "Un assistente interno può affiancare attività definite, come trovare un listino, consultare una procedura o raccogliere informazioni per una proposta.",
    "Il perimetro stabilisce quali fonti leggere e quali azioni non eseguire senza conferma.",
    "Prima dell’utilizzo si verificano esempi pertinenti, accessi e comportamento nei casi incompleti, senza attribuirgli autonomia generale sui processi aziendali.",
  ],
  approval: [
    "Prima di un’azione con effetto commerciale o documentale, il flusso può presentare il risultato a una persona autorizzata e raccoglierne la decisione.",
    "Soglie, eccezioni e responsabilità vengono esplicitate: produrre un testo non significa autorizzarne l’invio.",
    "Il revisore deve poter capire quali dati sono stati usati e quali punti richiedono ancora una verifica.",
  ],
  analysis: [
    "Il primo confronto ricostruisce un caso concreto: chi lavora, quali informazioni riceve e quale risultato deve consegnare.",
    "Si possono esaminare esempi autorizzati di catalogo, configurazione o documento, senza richiedere dati personali non necessari.",
    "Questa mappa aiuta a distinguere il problema prioritario dalle richieste accessorie e a individuare le decisioni ancora da prendere.",
  ],
  scope: [
    "Un primo perimetro può concentrarsi su una famiglia di prodotti o su un passaggio commerciale, con confini e criteri di verifica espliciti.",
    "Si chiariscono anche le attività escluse e le dipendenze esterne.",
    "Quando emerge una nuova esigenza, viene valutata rispetto al percorso concordato: non diventa automaticamente una funzione inclusa o una promessa di integrazione.",
  ],
  prototype: [
    "Un prototipo può rendere verificabili schermate, ordine delle scelte e messaggi prima dello sviluppo completo.",
    "Un caso rappresentativo permette di capire se l’utente trova ciò che serve e riconosce un errore.",
    "Il confronto riguarda il flusso concordato: una schermata dimostrativa non certifica già la disponibilità di integrazioni, cataloghi completi o funzioni non ancora implementate.",
  ],
  development: [
    "Le funzioni possono essere costruite per incrementi, partendo dal percorso essenziale e dai dati disponibili.",
    "Per esempio, si verifica prima una configurazione coerente e poi il suo riepilogo o salvataggio.",
    "Le decisioni tecniche seguono i confini concordati; cambiamenti a regole, ruoli o sistemi collegati richiedono una valutazione esplicita, non vengono nascosti dentro un ritocco dell’interfaccia.",
  ],
  testing: [
    "La verifica comprende il percorso ordinario e i casi che possono interromperlo: opzione incompatibile, dato mancante, permesso insufficiente o salvataggio da riprendere.",
    "Si scelgono dispositivi e scenari pertinenti al progetto.",
    "Un test automatico superato non sostituisce il confronto nell’interfaccia reale; limiti non verificati e decisioni dell’owner restano dichiarati separatamente prima del rilascio.",
  ],
  release: [
    "Il rilascio comprende il passaggio operativo di ciò che è stato verificato, con indicazioni per avvio, gestione e controlli successivi.",
    "Accessi, responsabilità e supporto vengono concordati sul progetto.",
    "La preparazione tecnica non coincide con un’autorizzazione a pubblicare: prima della messa online si distinguono verifiche concluse, approvazioni richieste e dipendenze ancora da risolvere.",
  ],
  supervision: [
    "Dopo aver definito il flusso, occorre stabilire come riconoscere risultati incompleti o non attendibili e chi deve verificarli.",
    "Si possono osservare esempi autorizzati, aggiornare i controlli e mantenere leggibili le eccezioni.",
    "Il monitoraggio è proporzionato al caso d’uso; non implica una supervisione continua o livelli di servizio che non siano stati concordati.",
  ],
  responsibility: [
    "Durante il progetto le decisioni su priorità, vincoli e prossime verifiche restano riferite a un interlocutore riconoscibile.",
    "Un cambiamento al catalogo o al flusso commerciale viene discusso nel suo contesto, senza trasferire all’azienda la gestione dei dettagli tecnici.",
    "Responsabilità e confini del lavoro vengono resi espliciti, insieme ai contributi specialistici eventualmente necessari.",
  ],
  specialists: [
    "Alcune fasi possono richiedere competenze specifiche, per esempio la preparazione di asset visuali o l’analisi di un sistema da integrare.",
    "Il loro coinvolgimento viene valutato rispetto al perimetro, con responsabilità e attività comprensibili.",
    "Non significa introdurre automaticamente un team esteso: il referente del progetto mantiene leggibili decisioni, dipendenze e passaggi da verificare.",
  ],
  structure: [
    "Una struttura snella serve a tenere il confronto vicino al problema da risolvere.",
    "Gli approfondimenti possono partire da un esempio di prodotto o da una proposta già gestita dall’azienda, usando soltanto materiali autorizzati.",
    "Il numero di passaggi viene proporzionato alla complessità, senza rinunciare a documentare vincoli, decisioni e verifiche che rendono utilizzabile la consegna.",
  ],
  furniture: [
    "In un catalogo di arredamento, la scelta di moduli e finiture può dipendere da misure, adiacenze e destinazione della composizione.",
    "Un configuratore può guidare il confronto e preparare un riepilogo per showroom o rete vendita.",
    "Le regole devono provenire dal produttore; la vista del progetto non sostituisce le verifiche tecniche necessarie prima della realizzazione.",
  ],
  industry: [
    "Per un prodotto industriale, un percorso guidato può partire dalla famiglia e proporre componenti compatibili con le esigenze dichiarate.",
    "Schede, codici e vincoli possono affiancare la configurazione prima del preventivo.",
    "L’analisi distingue le combinazioni già formalizzate dalle richieste che richiedono un tecnico: il sistema non certifica autonomamente prestazioni o compatibilità non documentate.",
  ],
  fashion: [
    "Materiali, colori e dettagli possono essere presentati in relazione al modello selezionato, aiutando a confrontare personalizzazioni realmente disponibili.",
    "Per esempio, una finitura può essere ammessa soltanto su alcune parti del prodotto.",
    "Occorre verificare catalogo, immagini e regole commerciali; la resa a schermo resta una rappresentazione e non sostituisce il confronto con il campione fisico.",
  ],
  automotive: [
    "Un configuratore può organizzare colori, allestimenti e optional rendendo visibili le dipendenze tra le scelte.",
    "Un pacchetto può includere alcune dotazioni o escluderne altre, secondo il catalogo fornito.",
    "Il progetto richiede dati aggiornabili e regole verificabili: non si assumono compatibilità, disponibilità o autorizzazioni di marca che non siano state definite per il caso concreto.",
  ],
  windows: [
    "La configurazione di un serramento può raccogliere misure, tipologia di apertura, materiali e finiture prima della preparazione dell’offerta.",
    "I vincoli dimensionali e gli accessori compatibili devono essere formalizzati sulle famiglie effettivamente disponibili.",
    "Una richiesta fuori regola può passare a verifica tecnica, senza essere trasformata in una combinazione vendibile o in una promessa di prestazione.",
  ],
  proofVisual: [
    "Una configurazione visuale permette di confrontare parti e materiali nello stesso prodotto, invece di leggerli soltanto in una lista.",
    "Il lavoro riguarda il collegamento tra scelte dell’interfaccia e anteprima comprensibile.",
    "Le immagini dei progetti documentano schermate reali; non costituiscono una recensione, una misura di risultato commerciale o la promessa che ogni catalogo richieda la stessa soluzione.",
  ],
  proofPortal: [
    "Un portale commerciale può avvicinare selezione degli articoli, composizione della proposta e archivio del lavoro svolto.",
    "Le schermate dei progetti mostrano come questi passaggi possono convivere in un’interfaccia dedicata.",
    "Ruoli, documenti e condizioni dipendono dal caso realizzato: l’esperienza non viene presentata come un prodotto standard già compatibile con qualsiasi rete vendita.",
  ],
  proofTechnical: [
    "Un configuratore tecnico collega scelte di prodotto e controlli al riepilogo economico previsto dal processo.",
    "Prima del documento è importante rendere riconoscibili articoli, quantità e condizioni utilizzate.",
    "Questo tipo di esperienza può orientare un nuovo progetto, ma catalogo, regole e integrazioni devono essere verificati nuovamente: non si trasferiscono dati o condizioni riservate di altri clienti.",
  ],
  input: [
    "Un documento, un form o un messaggio può essere il punto di ingresso di un flusso, purché origine e autorizzazioni siano chiare.",
    "Si definiscono i campi necessari e il trattamento degli allegati prima dell’elaborazione.",
    "Un contenuto ricevuto non autorizza ogni uso successivo: dati non pertinenti e richieste incomplete devono essere gestiti secondo il perimetro concordato.",
  ],
  crm: [
    "Il passaggio al CRM può preparare una richiesta organizzata nei campi previsti, quando interfacce e autorizzazioni sono disponibili.",
    "Prima si chiarisce se creare un nuovo elemento o collegarlo a uno esistente.",
    "La gestione dei duplicati e degli errori è parte del flusso; una classificazione automatica non deve cambiare indiscriminatamente lo stato di una relazione commerciale.",
  ],
  portal: [
    "Un portale può ricevere informazioni già controllate e presentarle accanto alla configurazione o alla richiesta pertinente.",
    "Per esempio, una bozza documentale può restare in attesa della verifica del responsabile.",
    "Accessi e azioni consentite devono seguire i ruoli del sistema, senza rendere pubbliche informazioni riservate o trasformare ogni dato ricevuto in un’operazione definitiva.",
  ],
  trace: [
    "Rendere leggibile un flusso significa distinguere input, risultato preparato, verifiche ed eventuale azione autorizzata.",
    "Si possono registrare gli stati utili a ricostruire un passaggio senza raccogliere informazioni superflue.",
    "Quali dati conservare, per quanto tempo e chi possa consultarli richiede decisioni esplicite nel progetto: il tracciamento non introduce da solo una politica di conservazione.",
  ],
  contactInfo: [
    "Per il primo confronto è utile descrivere un esempio concreto: un prodotto con varianti, un preventivo da preparare o un documento da verificare.",
    "Puoi indicare chi lo gestisce e quali sistemi sono già disponibili.",
    "Non servono credenziali, elenchi di clienti o documenti riservati nella richiesta iniziale; gli eventuali materiali necessari vengono concordati successivamente.",
  ],
  contactTimes: [
    "Una stima attendibile richiede di capire il percorso minimo, i dati disponibili e le dipendenze da altri sistemi.",
    "Il primo approfondimento serve a individuare questi punti, non a confermare automaticamente tempi o funzioni.",
    "Un catalogo già strutturato e uno da organizzare richiedono attività diverse; eventuali condizioni ancora aperte vengono chiarite prima di definire il perimetro.",
  ],
};

const routes = { home: "/", about: "/chi-siamo", configurators: "/configuratori-3d-2d", ecommerce: "/configuratori-ecommerce", cpq: "/software-cpq-portali-commerciali", planner: "/planner-configuratori-arredamento", automation: "/automazioni-ai-business", contact: "/contattaci" };
const row = (id, title, topic, href = "/contattaci#contatti") => ({ id, title, topic, href });
const pages = {
  home: {
    "home-problems": [row("varianti", "Molte varianti", "variants"), row("preventivi", "Preventivi manuali", "quotes"), row("regole", "Regole e incompatibilità", "rules"), row("rete", "Reti disallineate", "network")],
    solutions: [row("ecommerce", "Personalizzazione prima dell’acquisto", "ecommerce"), row("cpq", "Regole, listini e preventivi", "cpq"), row("planner", "Spazi e prodotti modulari", "planner")],
    capabilities: [row("configuratori", "Configuratori di prodotto interattivi", "visual"), row("ai", "Automazioni nel processo commerciale", "ai")],
    functions: [row("configurazione", "Configurazione", "combinations"), row("regole", "Regole", "rules"), row("prezzi", "Prezzi e listini", "pricing"), row("utenti", "Utenti e ruoli", "roles"), row("documenti", "PDF e documenti", "pdf"), row("salvataggi", "Salvataggi", "saves"), row("revisioni", "Revisioni", "revisions"), row("integrazioni", "Integrazioni", "integrations")],
    process: [row("analisi", "Analisi", "analysis"), row("prototipo", "Prototipo", "prototype"), row("sviluppo", "Sviluppo", "development"), row("test", "Test", "testing"), row("integrazione", "Integrazione", "integrations"), row("rilascio", "Rilascio", "release")],
  },
  about: {
    introduction: [row("referente", "Decisioni chiare, referente diretto", "responsibility")],
    model: [row("responsabilita", "Responsabilità diretta", "responsibility"), row("collaborazioni", "Collaborazioni specialistiche", "specialists"), row("struttura", "Struttura snella", "structure")],
    focus: [row("configuratori", "Configuratori", "combinations"), row("cpq", "CPQ e portali", "cpq"), row("planner-ai", "Planner e automazioni", "planner")],
    process: [row("contesto", "Contesto", "analysis"), row("perimetro", "Perimetro", "scope"), row("prototipo", "Prototipo", "prototype"), row("sviluppo", "Sviluppo", "development"), row("verifica", "Verifica", "testing"), row("continuita", "Continuità", "release")],
  },
  configurators: {
    "configurator-scenarios": [row("ecommerce", "Configuratore per e-commerce", "ecommerce"), row("portale", "Portale per rete commerciale", "network"), row("cpq", "Configuratore CPQ", "cpq"), row("planner", "Planner per arredamento", "planner")],
    "configurator-sectors": [row("arredamento", "Arredamento", "furniture"), row("industria", "Industria", "industry"), row("moda", "Moda e accessori", "fashion"), row("automotive", "Automotive", "automotive"), row("serramenti", "Serramenti", "windows")],
    proof: [row("visuale", "Configurazione 3D di prodotto", "proofVisual"), row("portale", "Portale preventivi B2B", "proofPortal"), row("tecnico", "Configuratore con listini e PDF", "proofTechnical")],
  },
  ecommerce: {
    "ecommerce-needs": [row("combinazioni", "Molte combinazioni", "combinations"), row("dipendenze", "Scelte dipendenti", "dependencies"), row("prezzo", "Prezzo variabile", "pricing"), row("ordini", "Ordini completi", "order")],
    features: [row("vincoli", "Compatibilità e vincoli", "rules"), row("prezzo", "Prezzo dinamico", "pricing"), row("visuale", "2D, 3D e AR quando utili", "visual"), row("salvataggio", "Salvataggio e condivisione", "saves"), row("carrello", "Carrello e ordine", "order"), row("piattaforma", "E-commerce esistente", "ecommerce")],
    process: [row("catalogo", "Catalogo", "catalog"), row("regole", "Regole", "rules"), row("prototipo", "Prototipo", "prototype"), row("sviluppo", "Sviluppo", "development"), row("integrazione", "Integrazione", "integrations"), row("test", "Test", "testing")],
  },
  cpq: {
    features: [row("configurazione", "Configurazione guidata", "combinations"), row("compatibilita", "Compatibilità e regole", "rules"), row("listini", "Listini, sconti e prezzi", "pricing")],
    "cpq-modules": [row("preventivi", "Preventivi e PDF", "pdf"), row("account", "Account, ruoli e autorizzazioni", "roles"), row("salvataggi", "Salvataggi e duplicazioni", "saves"), row("revisioni", "Revisioni", "revisions"), row("rete", "Agenti, dealer e clienti B2B", "network"), row("importazioni", "Importazioni", "imports"), row("dashboard", "Dashboard", "dashboard"), row("documenti", "Documenti", "documents"), row("integrazioni", "Integrazioni da analizzare", "integrations")],
    proof: [row("portale", "Portale preventivi B2B", "proofPortal"), row("tecnico", "Configuratore tecnico con listini e PDF", "proofTechnical"), row("moduli", "Moduli costruiti sul processo", "scope")],
    process: [row("mappa", "Mappa", "analysis"), row("priorita", "Priorità", "scope"), row("prototipo", "Prototipo", "prototype"), row("sviluppo", "Sviluppo", "development"), row("integrazione", "Integrazione", "integrations"), row("rilascio", "Rilascio", "release")],
  },
  planner: {
    "planner-scenarios": [row("composizioni", "Composizioni modulari", "modular"), row("misure", "Misure e vincoli", "dimensions"), row("cataloghi", "Cataloghi estesi", "catalog"), row("rete", "Rete commerciale", "network")],
    features: [row("moduli", "Moduli e collezioni", "catalog"), row("misure", "Misure e vincoli", "dimensions"), row("finiture", "Finiture e varianti", "finishes"), row("vista", "Vista 2D o 3D", "visual"), row("ambienti", "Ambienti", "spaces"), row("prezzi", "Prezzi e preventivi", "quotes"), row("dealer", "Dealer e agenti", "roles"), row("salvataggio", "Salvataggio e condivisione", "saves"), row("integrazioni", "Integrazioni", "integrations")],
    process: [row("catalogo", "Catalogo", "catalog"), row("vincoli", "Vincoli", "dimensions"), row("prototipo", "Prototipo", "prototype"), row("visuale", "Visuale", "visual"), row("commerciale", "Commerciale", "quotes"), row("integrazione", "Integrazione", "integrations")],
  },
  automation: {
    "automation-uses": [row("estrazione", "Estrazione da PDF e listini", "extraction"), row("classificazione", "Classificazione", "classification"), row("bozze", "Documenti e bozze di offerta", "drafts"), row("assistenza", "Assistenza contestuale", "assistance"), row("connessioni", "Form, email, CRM e portali", "transfer"), row("controlli", "Controlli sui workflow", "workflow"), row("ricerca", "Ricerca documentale", "search"), row("assistenti", "Assistenti interni contestuali", "assistants"), row("revisione", "Revisione e approvazione", "approval")],
    functions: [row("input", "PDF, form o email", "input"), row("estrazione", "Estrazione o classificazione", "extraction"), row("controlli", "Regole e controlli", "workflow"), row("revisione", "Revisione umana", "approval"), row("crm", "CRM", "crm"), row("portale", "Portale", "portal"), row("documento", "Documento", "drafts"), row("tracciamento", "Tracciamento", "trace")],
    process: [row("caso-uso", "Caso d’uso", "scope"), row("dati", "Dati", "input"), row("controlli", "Controlli", "workflow"), row("prototipo", "Prototipo", "prototype"), row("integrazione", "Integrazione", "transfer"), row("supervisione", "Supervisione", "supervision")],
  },
  contact: { information: [row("contesto", "Cosa è utile indicare", "contactInfo"), row("tempi", "Tempi proporzionati al contesto", "contactTimes")] },
};

//47: only these nine cards navigate. Their editorial records stay traceable,
//but no detail UI is emitted; destination URLs come from the original cards.
const navigation = {
  home: {
    solutions: { ecommerce: "/configuratori-ecommerce", cpq: "/software-cpq-portali-commerciali", planner: "/planner-configuratori-arredamento" },
    capabilities: { configuratori: "/configuratori-3d-2d", ai: "/automazioni-ai-business" },
  },
  configurators: { "configurator-scenarios": { ecommerce: "/configuratori-ecommerce", portale: "/software-cpq-portali-commerciali", cpq: "/software-cpq-portali-commerciali", planner: "/planner-configuratori-arredamento" } },
};
const inventory = [];
for (const [pageKey, groups] of Object.entries(pages)) {
  for (const [group, entries] of Object.entries(groups)) {
    for (const entry of entries) {
      entry.key = `${routes[pageKey]}#${group}/${entry.id}`;
      entry.domId = `detail-${pageKey}-${group}-${entry.id}`;
      entry.paragraphs = copy[entry.topic];
      entry.text = entry.paragraphs.join(" ");
      entry.action = navigation[pageKey]?.[group]?.[entry.id] ? "navigate" : "detail";
      entry.destination = navigation[pageKey]?.[group]?.[entry.id] || "#" + entry.domId;
      entry.cta = "Richiedi un preventivo";
      inventory.push({ key: entry.key, pageKey, group, id: entry.id, title: entry.title, topic: entry.topic, action: entry.action, destination: entry.destination, paragraphs: entry.paragraphs.length, words: entry.text.split(/\s+/u).length });
    }
  }
}

export default { version: 47, routes, pages, inventory, exclusions: ["FAQ accordion", "campi e controlli dei sei form", "banner consenso", "opzioni e controlli demo", "contatti diretti mailto/tel", "card navigazione: unico link nativo senza dettaglio", "gallerie progetto: dialog dedicato dello stesso motore", "blocco e-commerce: demo WDRacing"] };
