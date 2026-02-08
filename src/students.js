/**
 * 10 realistische leerlingprofielen (14-17 jaar)
 * Elk profiel simuleert een ander type leerling met
 * verschillende schrijfstijlen, kennisniveaus en perspectieven.
 */

const students = [
  {
    id: 1,
    naam: "Emma de Vries",
    leeftijd: 14,
    klas: "3 havo",
    profiel: "Gemotiveerde leerling, netjes maar nog onzeker in argumentatie",
    schrijfstijl: "Korte zinnen, voorzichtig geformuleerd, gebruikt 'ik denk dat'",
    perspectief: "Sociaal bewust, kijkt naar impact op mensen",
    typfouten: false,
    input: `Ik denk dat de allerbelangrijkste gebeurtenis van 2025 de overstromingen in Spanje en andere landen was. Heel veel mensen zijn daardoor hun huis kwijtgeraakt en sommige mensen zijn zelfs overleden. Ik vind dit de belangrijkste gebeurtenis omdat het laat zien dat klimaatverandering echt is en dat het niet alleen iets is van de toekomst maar van nu.`
  },
  {
    id: 2,
    naam: "Daan Bakker",
    leeftijd: 15,
    klas: "3 vwo",
    profiel: "Slimme leerling maar doet het minimum, informeel taalgebruik",
    schrijfstijl: "Spreektaal, korte antwoorden, geen structuur",
    perspectief: "Technologie en gaming",
    typfouten: true,
    input: `ja dus ik vind eigenlijk dat AI het belangrijkst was in 2025. chatgpt en zo werden echt mega goed en iedereen gebruikte het ineens voor school en werk enzo. mijn vader zegt dat er mensen hun baan door kwijtraken dus ja dat is best wel belangrijk toch`
  },
  {
    id: 3,
    naam: "Fatima El Amrani",
    leeftijd: 16,
    klas: "4 havo",
    profiel: "Hardwerkende leerling met goede woordenschat, gestructureerd",
    schrijfstijl: "Formeel, probeert connectiewoorden te gebruiken, soms te complex",
    perspectief: "Internationaal georiënteerd, mensenrechten",
    typfouten: false,
    input: `De belangrijkste gebeurtenis van 2025 is naar mijn mening het conflict in het Midden-Oosten en de gevolgen die dit heeft gehad voor burgers. Ten eerste heeft dit conflict geleid tot een enorme humanitaire crisis waarbij duizenden onschuldige mensen getroffen zijn. Ten tweede heeft het de internationale gemeenschap verdeeld, wat laat zien hoe moeilijk het is om tot vrede te komen. Daarnaast heeft het ook in Nederland geleid tot protesten en discussies, waardoor het ook ons raakt.`
  },
  {
    id: 4,
    naam: "Sem van Dijk",
    leeftijd: 14,
    klas: "2 vwo",
    profiel: "Enthousiast maar chaotisch, springt van punt naar punt",
    schrijfstijl: "Veel uitroeptekens, enthousiast, ongestructureerd",
    perspectief: "Sport en entertainment",
    typfouten: true,
    input: `Oké ik weet het! De verkiezingen in Amerika waren echt het belangrijkste van 2025!! Trump werd weer president en dat veranderde echt ALLES. Iedereen had het erover op school en op tiktok. mijn moeder was er echt niet blij me en mijn opa zei dat het gevaarlijk was. Het is belangrijk omdat amerika zo machtig is dat het de hele wereld beinvloed!`
  },
  {
    id: 5,
    naam: "Lisa Jansen",
    leeftijd: 17,
    klas: "5 vwo",
    profiel: "Excellente leerling, kritisch denker, goed in nuance",
    schrijfstijl: "Academisch, genuanceerd, gebruikt bronverwijzingen",
    perspectief: "Wetenschappelijk en analytisch",
    typfouten: false,
    input: `De belangrijkste gebeurtenis van 2025 was mijns inziens de doorbraak in kunstmatige intelligentie en de maatschappelijke discussie die hieruit voortvloeide. Hoewel er veel belangrijke gebeurtenissen waren, zoals geopolitieke conflicten en klimaatrampen, was AI de rode draad door vrijwel alle grote ontwikkelingen. AI werd ingezet bij wetenschappelijk onderzoek, veranderde de arbeidsmarkt fundamenteel en dwong overheden tot nieuwe wetgeving. De EU AI Act trad in werking, wat een precedent schiep voor wereldwijde regulering. Dit maakt het niet slechts een technologische ontwikkeling, maar een kantelpunt in hoe wij als samenleving functioneren.`
  },
  {
    id: 6,
    naam: "Jayden Pieterse",
    leeftijd: 15,
    klas: "3 vmbo-t",
    profiel: "Vindt school saai, doet moeite maar taal is niet zijn sterkste kant",
    schrijfstijl: "Kort, simpel, veel straattaal",
    perspectief: "Eigen omgeving en sociale media",
    typfouten: true,
    input: `ik ga zeggen dat de belangrijkste gebeurtenis de aardbeving in turkije was want dat was echt heftig. er gingen echt heel veel mensen dood en alles was kapot. ik heb het gezien op instagram en het was echt niet normaal. mijn buurmeisje komt uit turkije en haar familie was ook getroffen dus dan merk je het ook echt`
  },
  {
    id: 7,
    naam: "Sophie Mulder",
    leeftijd: 16,
    klas: "4 vwo",
    profiel: "Creatieve leerling, goed in taal, soms te emotioneel in argumentatie",
    schrijfstijl: "Beeldend, emotioneel, gebruikt retorische vragen",
    perspectief: "Milieu en duurzaamheid",
    typfouten: false,
    input: `Stel je voor: je wordt wakker en de lucht buiten is oranje van de bosbranden. Dit was de realiteit voor miljoenen mensen in 2025. De klimaatcrisis is voor mij dé gebeurtenis van het jaar, niet omdat het één moment was, maar omdat het een heel jaar van extremen was. Van hittegolven in Europa tot overstromingen in Azië - wanneer gaan we eindelijk inzien dat we iets moeten veranderen? De natuur schreeuwt om hulp en wij scrollen gewoon door op onze telefoon.`
  },
  {
    id: 8,
    naam: "Mohammed Yilmaz",
    leeftijd: 15,
    klas: "3 havo",
    profiel: "Gemiddelde leerling, probeert zijn best, soms moeite met structuur",
    schrijfstijl: "Mix van formeel en informeel, zoekend naar de juiste woorden",
    perspectief: "Economie en dagelijks leven",
    typfouten: true,
    input: `Ik vind dat de economische crisis de belangrijkste gebeurtenis van 2025 was. Alles werd duurder, boodschappen, benzine, en huizen. Mijn ouders moesten echt zuiniger gaan doen en veel gezinnen hadden het moeilijk. Dit is belangrijk omdat het iedereen raakt, niet alleen rijke of arme mensen. Als je niet genoeg geld hebt voor eten dan is dat toch het belangrijkste probleem? De politiek deed er ook niet echt veel aan vind ik.`
  },
  {
    id: 9,
    naam: "Fleur Hendriks",
    leeftijd: 17,
    klas: "5 havo",
    profiel: "Sociaal betrokken, actief in leerlingenraad, goed in debatteren",
    schrijfstijl: "Overtuigend, gebruikt tegenargumenten, gestructureerd",
    perspectief: "Politiek en democratie",
    typfouten: false,
    input: `De belangrijkste gebeurtenis van 2025 was de opkomst van populisme en de bedreiging van de democratie in meerdere landen. Sommigen zullen zeggen dat klimaatverandering of AI belangrijker was, maar ik ben het daar niet mee eens. Zonder een goed functionerende democratie kunnen we namelijk geen van die problemen oplossen. In landen als de VS, maar ook in Europa, zagen we hoe politici de rechtsstaat ondermijnden. Als we onze democratie niet beschermen, verliezen we het instrument waarmee we alle andere problemen kunnen aanpakken.`
  },
  {
    id: 10,
    naam: "Bram de Groot",
    leeftijd: 14,
    klas: "3 vmbo-k",
    profiel: "Heeft moeite met schrijven, korte antwoorden, maar heeft wel een mening",
    schrijfstijl: "Heel kort, simpele woorden, geen connectiewoorden",
    perspectief: "Eigen ervaring en directe omgeving",
    typfouten: true,
    input: `de belangrijkste gebeurtenis van 2025 vind ik dat er zo veel mensen naar nederland kwamen. het asielprobleem was echt groot. er was geen plek meer en mensen moesten buiten slapen. dat is niet goed. mijn school had er ook last van want er kwamen nieuwe kinderen bij die geen nederlands spraken. ik vind dat de regering er iets aan moet doen`
  }
];

module.exports = { students };
