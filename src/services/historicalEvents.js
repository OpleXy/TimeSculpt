/**
 * Database med viktige historiske hendelser for å redusere API-kall
 * Denne lokale databasen brukes først før det gjøres API-kall til OpenAI
 */

export const historicalEvents = {
    // Andre verdenskrig
    "polen invadert": {
      title: "Tyskland invaderer Polen",
      date: "1939-09-01",
      description: "Tyskland invaderte Polen, noe som markerte starten på andre verdenskrig i Europa.",
      size: "large",
      color: "red"
    },
    "pearl harbor": {
      title: "Angrep på Pearl Harbor",
      date: "1941-12-07",
      description: "Japan angrep den amerikanske flåtebasen Pearl Harbor, noe som førte til at USA gikk inn i andre verdenskrig.",
      size: "large",
      color: "red"
    },
    "d-dag": {
      title: "D-dagen (invasjonen av Normandie)",
      date: "1944-06-06",
      description: "De allierte styrkene landet i Normandie i Frankrike i den største amfibiske operasjonen i historien.",
      size: "large",
      color: "blue"
    },
    "hiroshima": {
      title: "Atombombing av Hiroshima",
      date: "1945-08-06",
      description: "USA slapp den første atombomben brukt i krig over den japanske byen Hiroshima.",
      size: "large",
      color: "red"
    },
    "nagasaki": {
      title: "Atombombing av Nagasaki",
      date: "1945-08-09",
      description: "USA slapp den andre atombomben over den japanske byen Nagasaki, tre dager etter bombingen av Hiroshima.",
      size: "medium",
      color: "red"
    },
    "tyskland overgivelse": {
      title: "Nazi-Tyskland overgir seg",
      date: "1945-05-08",
      description: "Nazi-Tyskland overga seg betingelsesløst til de allierte, noe som markerte slutten på andre verdenskrig i Europa.",
      size: "large",
      color: "green"
    },
    "japan overgivelse": {
      title: "Japan overgir seg",
      date: "1945-09-02",
      description: "Japan undertegnet overgivelsesdokumenter på slagskipet USS Missouri, noe som formelt avsluttet andre verdenskrig.",
      size: "large",
      color: "green"
    },
    
    // Den kalde krigen
    "berlinmuren": {
      title: "Berlinmuren bygges",
      date: "1961-08-13",
      description: "Øst-Tyskland begynte byggingen av Berlinmuren for å hindre migrasjon til Vest-Berlin.",
      size: "medium",
      color: "red"
    },
    "berlinmuren fall": {
      title: "Berlinmurens fall",
      date: "1989-11-09",
      description: "Berlinmuren falt, noe som symboliserte slutten på den kalde krigen og deling av Tyskland.",
      size: "large",
      color: "green"
    },
    "sovjetunionen oppløsning": {
      title: "Sovjetunionens oppløsning",
      date: "1991-12-26",
      description: "Sovjetunionen ble formelt oppløst, og dermed endte den kalde krigen.",
      size: "large",
      color: "blue"
    },
    
    // Romfartshistorie
    "sputnik": {
      title: "Sputnik 1 oppskyting",
      date: "1957-10-04",
      description: "Sovjetunionen skjøt opp Sputnik 1, den første kunstige satellitten, og startet romkapplčpet.",
      size: "medium",
      color: "blue"
    },
    "månelanding": {
      title: "Første menneskelige månelanding",
      date: "1969-07-20",
      description: "Neil Armstrong ble den første personen til å gå på månen under Apollo 11-oppdraget.",
      size: "large",
      color: "blue"
    },
    
    // Norsk historie
    "norges grunnlov": {
      title: "Norges grunnlov underskrives",
      date: "1814-05-17",
      description: "Norges grunnlov ble vedtatt på Eidsvoll, og etablerte Norge som et konstitusjonelt monarki.",
      size: "large",
      color: "blue"
    },
    "unionoppløsning": {
      title: "Unionsoppløsningen med Sverige",
      date: "1905-06-07",
      description: "Stortinget erklærte unionen med Sverige for oppløst, noe som førte til Norges uavhengighet.",
      size: "medium",
      color: "green"
    },
    "olje funnet": {
      title: "Olje oppdaget i Nordsjøen",
      date: "1969-12-23",
      description: "Phillips Petroleum fant Ekofisk-feltet i Nordsjøen, noe som markerte starten på den norske oljealderen.",
      size: "medium",
      color: "blue"
    },
    "eec nei": {
      title: "Folkeavstemning om EEC",
      date: "1972-09-25",
      description: "Norske velgere stemte nei til medlemskap i Det europeiske økonomiske fellesskap (EEC).",
      size: "medium",
      color: "orange"
    },
    "eu nei": {
      title: "Folkeavstemning om EU",
      date: "1994-11-28",
      description: "Norske velgere stemte igjen nei til medlemskap i Den europeiske union (EU).",
      size: "medium",
      color: "orange"
    },
    
    // Andre viktige hendelser
    "muren fall": {
      title: "Berlinmurens fall",
      date: "1989-11-09",
      description: "Berlinmuren falt, noe som symboliserte slutten på den kalde krigen og gjenforening av Tyskland.",
      size: "large",
      color: "green"
    },
    "internet": {
      title: "World Wide Web lanseres",
      date: "1991-08-06",
      description: "Tim Berners-Lee publiserte verdens første nettside og lanserte World Wide Web for offentligheten.",
      size: "medium", 
      color: "blue"
    },
    "nelson mandela frigjort": {
      title: "Nelson Mandela frigis",
      date: "1990-02-11",
      description: "Nelson Mandela ble frigitt etter 27 år i fengsel, et vendepunkt i kampen mot apartheid i Sør-Afrika.",
      size: "medium",
      color: "green"
    },
    "facebook": {
      title: "Facebook lanseres",
      date: "2004-02-04",
      description: "Mark Zuckerberg lanserte Facebook fra sitt studentrom på Harvard University.",
      size: "medium",
      color: "blue"
    },
    "iphone": {
      title: "Første iPhone lanseres",
      date: "2007-01-09",
      description: "Steve Jobs presenterte den første iPhone, som revolusjonerte mobiltelefonimarkedet.",
      size: "medium",
      color: "blue"
    },
    "finanskrise": {
      title: "Global finanskrise",
      date: "2008-09-15",
      description: "Lehman Brothers kollapset, noe som intensiverte den globale finanskrisen.",
      size: "large",
      color: "red"
    },
    "arabisk vår": {
      title: "Den arabiske våren begynner",
      date: "2010-12-18",
      description: "Opprør i Tunisia startet bølgen av protester og regimeskifter kjent som den arabiske våren.",
      size: "medium",
      color: "orange"
    },
    "corona": {
      title: "COVID-19 erklært pandemi",
      date: "2020-03-11",
      description: "Verdens helseorganisasjon (WHO) erklærte COVID-19-utbruddet som en global pandemi.",
      size: "large",
      color: "red"
    }
  };
  
  /**
   * Søk etter hendelser i vår lokale database
   * @param {string} query - Søketeksten
   * @returns {Object|null} - Matchende hendelse eller null hvis ingen match
   */
  export function findHistoricalEvent(query) {
    const normalizedQuery = query.toLowerCase();
    
    // Sjekk for direkte treff
    for (const [key, event] of Object.entries(historicalEvents)) {
      if (normalizedQuery.includes(key)) {
        return {
          commandType: "add_event",
          event: event
        };
      }
    }
    
    // Sjekk for spesialiserte mønstre
    if (containsPolandInvasion(normalizedQuery)) {
      return {
        commandType: "add_event",
        event: historicalEvents["polen invadert"]
      };
    }
    
    if (containsMoonLanding(normalizedQuery)) {
      return {
        commandType: "add_event",
        event: historicalEvents["månelanding"]
      };
    }
    
    if (containsBerlinWall(normalizedQuery)) {
      return {
        commandType: "add_event",
        event: historicalEvents["berlinmuren fall"]
      };
    }
    
    // Ingen treff
    return null;
  }
  
  // Hjelpefunksjoner for å gjenkjenne vanlige temaer
  function containsPolandInvasion(text) {
    const patterns = [
      'polen ble invadert',
      'invasjon av polen',
      'invasjonen av polen',
      'angrep på polen',
      'når startet andre verdenskrig',
      'polen invadert',
      'innvadert polen'
    ];
    
    return patterns.some(pattern => text.includes(pattern));
  }
  
  function containsMoonLanding(text) {
    const patterns = [
      'månelandingen',
      'landing på månen',
      'gikk på månen',
      'reiste til månen',
      'apollo 11',
      'neil armstrong',
      'måneferden'
    ];
    
    return patterns.some(pattern => text.includes(pattern));
  }
  
  function containsBerlinWall(text) {
    const patterns = [
      'berlinmuren',
      'muren i berlin',
      'berlin wall',
      'fall av muren',
      'muren falt',
      'berlinmuren falt'
    ];
    
    return patterns.some(pattern => text.includes(pattern));
  }
  
  export default {
    historicalEvents,
    findHistoricalEvent
  };