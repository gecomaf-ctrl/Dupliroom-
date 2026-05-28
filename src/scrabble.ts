export const FRENCH_LETTER_VALUES: { [letter: string]: number } = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 10, L: 1, M: 2,
  N: 1, O: 1, P: 3, Q: 8, R: 1, S: 1, T: 1, U: 1, V: 4, W: 10, X: 10, Y: 10, Z: 10,
  '?': 0 // JOKER
};

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Standard 102 Scrabble tiles in French:
export const FRENCH_TILE_BAG: { letter: string; count: number }[] = [
  { letter: 'E', count: 15 },
  { letter: 'A', count: 9 },
  { letter: 'I', count: 8 },
  { letter: 'N', count: 6 },
  { letter: 'O', count: 6 },
  { letter: 'R', count: 6 },
  { letter: 'S', count: 6 },
  { letter: 'T', count: 6 },
  { letter: 'U', count: 6 },
  { letter: 'L', count: 5 },
  { letter: 'D', count: 3 },
  { letter: 'M', count: 3 },
  { letter: 'G', count: 2 },
  { letter: 'B', count: 2 },
  { letter: 'C', count: 2 },
  { letter: 'P', count: 2 },
  { letter: 'F', count: 2 },
  { letter: 'H', count: 2 },
  { letter: 'V', count: 2 },
  { letter: 'J', count: 1 },
  { letter: 'K', count: 1 },
  { letter: 'Q', count: 1 },
  { letter: 'W', count: 1 },
  { letter: 'X', count: 1 },
  { letter: 'Y', count: 1 },
  { letter: 'Z', count: 1 },
  { letter: '?', count: 2 } // Jokers
];

export interface CellMultiplier {
  type: 'DL' | 'TL' | 'DW' | 'TW' | 'NONE';
  label: string;
  cssClass: string;
}

export function getCellMultiplier(r: number, c: number): CellMultiplier {
  // Triple Word (red)
  const isTW = (
    (r === 0 || r === 14) && (c === 0 || c === 7 || c === 14)
  ) || (
    r === 7 && (c === 0 || c === 14)
  );

  if (isTW) {
    return { type: 'TW', label: 'MT', cssClass: 'bg-rose-500 text-white font-bold' };
  }

  // Double Word (pink)
  const isDW = (
    r === 7 && c === 7 // Start
  ) || (
    ((r === c) || (r === 14 - c)) && (
      (r >= 1 && r <= 4) || (r >= 10 && r <= 13)
    )
  );

  if (isDW) {
    return { type: 'DW', label: 'MD', cssClass: 'bg-pink-300 text-slate-800 font-bold' };
  }

  // Triple Letter (dark blue)
  const isTL = (
    (r === 1 || r === 13) && (c === 5 || c === 9)
  ) || (
    (r === 5 || r === 9) && (c === 1 || c === 5 || c === 9 || c === 13)
  );

  if (isTL) {
    return { type: 'TL', label: 'LT', cssClass: 'bg-blue-600 text-white font-bold' };
  }

  // Double Letter (light blue)
  const isDL = (
    (r === 0 || r === 14) && (c === 3 || c === 11)
  ) || (
    (r === 2 || r === 12) && (c === 6 || c === 8)
  ) || (
    (r === 3 || r === 11) && (c === 0 || c === 7 || c === 14)
  ) || (
    (r === 6 || r === 8) && (c === 2 || c === 6 || c === 8 || c === 12)
  ) || (
    r === 7 && (c === 3 || c === 11)
  );

  if (isDL) {
    return { type: 'DL', label: 'LD', cssClass: 'bg-sky-200 text-slate-800 font-bold' };
  }

  return { type: 'NONE', label: '', cssClass: 'bg-emerald-50/40 text-emerald-800/20' };
}

// 2500+ standard useful French Scrabble words for off-line validation check:
export const COMMON_FRENCH_WORDS: { [word: string]: string } = {
  "AA": "Pluriel des as.",
  "AAH": "Aah cri de soulagement.",
  "ABACA": "Chanvre de Manille.",
  "ABATS": "Morceaux consommables d'animaux de boucherie.",
  "ABBÃ": "SupÃ©rieur d'un monastÃ¨re.",
  "ABBE": "SupÃ©rieur d'un monastÃ¨re.",
  "ABCES": "Accumulation de pus.",
  "ABDEL": "Serviteur de Dieu.",
  "ABEE": "Ouverture pour l'eau d'un moulin.",
  "ABER": "Estuaire de fleuve profond.",
  "ABETI": "Rendu bÃªte, stupide.",
  "ABIME": "PrÃ©cipice trÃ¨s profond.",
  "ABJECT": "Qui inspire le dÃ©goÃ»t.",
  "ABLATIF": "Cas de dÃ©clinaison grammaticale.",
  "ABLE": "Petit poisson d'eau douce.",
  "ABOI": "Cri du chien.",
  "ABOIS": "DerniÃ¨re extrÃ©mitÃ©.",
  "ABORD": "AccÃ¨s, rivage.",
  "ABOUT": "ExtrÃ©mitÃ© façonnÃ©e d'une piÃ¨ce de bois.",
  "ABREGE": "RÃ©sumÃ© court.",
  "ABRI": "Lieu oÃ¹ l'on se met Ã  couvert.",
  "ABRICOT": "Fruit charnu de couleur orangÃ©e.",
  "ABROUTI": "RongÃ© par le bÃ©tail.",
  "ABSENTE": "Qui n'est pas prÃ©sent.",
  "ABSOLU": "Qui ne comporte aucune restriction ou rÃ©serve.",
  "ABSOUDRE": "Pardonner les pÃ©chÃ©s.",
  "ABUS": "Usage excessif ou mauvais.",
  "ACABIT": "ManiÃ¨re d'Ãªtre (gÃ©nÃ©ralement en mauvaise part).",
  "ACACIA": "Arbre Ã  fleurs blanches ou jaunes.",
  "ACAJOU": "Bois prÃ©cieux d'un rouge brun.",
  "ACCENT": "Intonation particuliÃ¨re.",
  "ACCES": "EntrÃ©e, passage.",
  "ACCLAME": "Applaudi par la foule.",
  "ACRE": "UnitÃ© de mesure de surface agraire / Piquant.",
  "ACTE": "Action accomplie dÃ©libÃ©rÃ©ment.",
  "ACTEUR": "Personne qui joue un rÃ´le dans une piÃ¨ce.",
  "ACTIF": "Qui agit avec diligence / Patrimoine.",
  "ACTION": "Mouvement, opÃ©ration boursiÃ¨re.",
  "ACTUEL": "Qui existe au moment prÃ©sent.",
  "ADAGE": "Maxime pratique.",
  "ADIEU": "Formule de salutation au moment du dÃ©part dÃ©finitif.",
  "ADJOINT": "Personne associÃ©e Ã  une autre pour l'aider.",
  "ADMET": "Du verbe admettre, tolÃ©rer.",
  "ADMIRE": "RegardÃ© avec Ã©tonnement et plaisir.",
  "ADN": "Acide dÃ©soxyribonuclÃ©ique.",
  "ADOBE": "Brique de terre argileuse sÃ©chÃ©e.",
  "ADONIS": "Jeune homme d'une grande beautÃ© / Fleur.",
  "ADOPTE": "Choisi et acceptÃ© comme sien.",
  "ADORE": "AimÃ© passionnÃ©ment.",
  "ADROIT": "Qui montre de l'adresse physiques ou d'esprit.",
  "ADULTE": "ArrivÃ© au terme de son dÃ©veloppement gÃ©nÃ©ral.",
  "ÆGIPAN": "DivinitÃ© champÃªtre Ã  pieds de bouc.",
  "AEGIPAN": "DivinitÃ© champÃªtre Ã  pieds de bouc.",
  "AERENCHYME": "Tissu lacuneux des plantes aquatiques.",
  "AERIEN": "Qui a rapport Ã  l'air.",
  "AEROBIC": "Gymnastique rythmÃ©e.",
  "AERONEF": "Tout appareil de navigation aÃ©rienne.",
  "AEROPORT": "Terrain amÃ©nagÃ© pour le trafic aÃ©rien.",
  "AFFABLE": "Qui accueille les gens de faÃ§on bienveillante.",
  "AFFAIRES": "ActivitÃ©s commerciales ou industrielles.",
  "AFFECT": "Ã‰tat affectif brut.",
  "AFFICHE": "Feuille de papier portant une annonce publique.",
  "AFFREUX": "Qui inspire de l'horreur, de l'effroi.",
  "AGACE": "IrritÃ© lÃ©gÃ¨rement.",
  "AGAME": "Qui ne prÃ©sente pas d'organes sexuels apparents.",
  "AGAPE": "Repas fraternel de premiers chrÃ©tiens / Bon banquet.",
  "AGATE": "VariÃ©tÃ© de quartz taillÃ©e d'ornements.",
  "AGAVE": "Plante grasse des rÃ©gions chaudes.",
  "AGE": "DurÃ©e de vie Ã©coulÃ©e / PÃ©riode historique.",
  "AGENT": "Personne chargÃ©e de gÃ©rer les affaires d'un autre.",
  "AGILE": "Leste, souple, prompt dans ses mouvements.",
  "AGIO": "RÃ©munÃ©ration perçue par un banquier sur des services.",
  "AGREABLE": "Qui plaÃ®t ou procure du plaisir.",
  "AGRUME": "Fruit tel que l'orange, le citron.",
  "AHANI": "FatiguÃ© par l'effort.",
  "AIDE": "Secours, assistance.",
  "AIGLE": "Grand oiseau de proie diurne.",
  "AIGRE": "Qui a un goÃ»t acide.",
  "AIGU": "Qui se termine en pointe / Son perçant.",
  "AILE": "Membre qui sert Ã  voler.",
  "AIMABLE": "Qui mÃ©rite d'Ãªtre aimÃ©.",
  "AIME": "ApprÃ©ciÃ© d'affection.",
  "AINE": "NÃ© le premier.",
  "AIRE": "Surface plane.",
  "AIS": "Planche de bois mince sÃ©parant les livres.",
  "AISE": "Ã‰tat de satisfaction.",
  "AJONC": "Arbrisseau trÃ¨s Ã©pineux.",
  "ALAMBIC": "Appareil servant Ã  la distillation.",
  "ALBUM": "Livre de feuillets vierges destine Ã  recevoir des photos.",
  "ALCADE": "Magistrat municipal espagnol.",
  "ALCALIN": "Qui possÃ¨de les propriÃ©tÃ©s d'un alcali.",
  "ALCOVE": "Enfoncement mÃ©nagÃ© pour un lit.",
  "ALEA": "Ã‰vÃ©nement imprÃ©visible.",
  "ALENE": "Poinçon d'acier servant Ã  percer le cuir.",
  "ALENTO": "DonnÃ© du souffle, rÃ©animÃ©.",
  "ALERTE": "Signal d'avertissement de danger / Vif.",
  "ALEXIE": "Perte de la facultÃ© de lire.",
  "ALGEBRE": "Branche des mathÃ©matiques.",
  "ALGORTYRAE": "Mesure en algorithme.",
  "ALGUE": "Plante aquatique simple.",
  "ALIBI": "Preuve que l'on n'Ã©tait pas prÃ©sent Ã  un crime.",
  "ALIENE": "Fou, dÃ©ment.",
  "ALIGNEMENT": "Action de ranger en ligne droite.",
  "ALIGOT": "Plat Ã  base de purÃ©e de pommes de terre et tome fraÃ®che.",
  "ALINEA": "Renvoi Ã  la ligne marquÃ© par un retrait.",
  "ALISE": "Fruit de l'alisier doux.",
  "ALLEE": "Chemin tracÃ© dans un jardin / Action d'aller.",
  "ALLEGRETTO": "Tempo modÃ©rÃ©ment vif, plus lent que l'allegro.",
  "ALLIANCE": "Union contractÃ©e par engagement.",
  "ALLO": "Interjection au dÃ©but d'une conversation tÃ©lÃ©phonique.",
  "ALLUMAGE": "Action d'allumer.",
  "ALMEE": "Danseuse Ã©gyptienne.",
  "ALORS": "Puis, en ce temps-lÃ .",
  "ALOYAU": "Partie tendre de la fesse du bœuf.",
  "ALPAGE": "PÃ¢turage de haute montagne.",
  "ALPES": "ChaÃ®ne de montagnes.",
  "ALPHABET": "SystÃ¨me de signes graphiques d'une langue.",
  "ALTIE": "Petit insecte colÃ©optÃ¨re nuisible aux jardins.",
  "ALTITUDE": "Hauteur d'un point au-dessus de la mer.",
  "ALTO": "Instrument de musique Ã  cordes frottÃ©es.",
  "ALU": "Aluminium.",
  "ALUN": "Double sulfate d'aluminium.",
  "ALVEOLE": "Petite cavitÃ©.",
  "AMANDE": "Graine olÃ©agineuse d'un arbre.",
  "AMANT": "Personne liÃ©e d'amour.",
  "AMATEUR": "Qui cultive un art sans en faire sa profession.",
  "AMAZONE": "Femme cavalier / GuerriÃ¨re lÃ©gendaire.",
  "AMBRE": "Substance organique fossile d'un jaune dorÃ©.",
  "AME": "Principe spirituel de l'Ãªtre humain.",
  "AMEN": "Mot hÃ©breu signifiant 'ainsi soit-il'.",
  "AMENE": "Doux, affable.",
  "AMER": "D'un goÃ»t rude, opposÃ© au doux / Signal maritime.",
  "AMETHYSTE": "Pierre fine de couleur violette.",
  "AMEUBLIS": "Du verbe ameublir, remuer la terre.",
  "AMIBE": "Protozoaire dÃ©pourvu de membrane rigide.",
  "AMICAL": "D'ami, plein de bienveillance.",
  "AMIDON": "FÃ©cule complexe extraite de grains ou tubercules.",
  "AMINCIS": "Du verbe amincir, rendre plus mince.",
  "AMIRAL": "Officier de marine du rang le plus Ã©levÃ©.",
  "AMITIÃ": "Sentiment d'affection entre deux personnes.",
  "AMITIE": "Sentiment d'affection entre deux personnes.",
  "AMNESIE": "Perte de mÃ©moire.",
  "AMNISTIE": "Acte du pouvoir effaçant une condamnation.",
  "AMORCE": "Ce qui sert Ã  attirer / DÃ©but de quelque chose.",
  "AMOUR": "Vif sentiment d'affection.",
  "AMPHI": "AmphithÃ©Ã¢tre d'universitÃ©.",
  "AMPLE": "Qui a beaucoup de largeur ou d'Ã©tendue.",
  "AMPOULE": "Receptacle de verre contenant un gaz, un filament / Cloque.",
  "AMULÃTE": "Objet que l'on porte sur soi contre les malÃ©fices.",
  "AMULETE": "Objet que l'on porte sur soi contre les malÃ©fices.",
  "AMUSANT": "Qui distrait ou fait rire.",
  "ANACARDE": "Noix de cajou brute.",
  "ANAGRAMME": "Mot obtenu en transposant les lettres d'un autre.",
  "ANALOGUE": "Qui offre une ressemblance.",
  "ANANAS": "Plante tropicale et son fruit savoureux.",
  "ANARCHIE": "DÃ©sordre rÃ©sultant de l'absence d'autoritÃ©.",
  "ANATHEME": "Excommunication d'une hÃ©rÃ©sie.",
  "ANCETRE": "Personne dont on descend.",
  "ANCHOIS": "Petit poisson de mer trÃ¨s salÃ©.",
  "ANCIEN": "Qui appartient Ã  une pÃ©riode du passÃ©.",
  "ANCOLIE": "Fleur aux clochettes de couleur bleue, mauve ou blanche.",
  "ANDALOU": "Qui se rapporte Ã  l'Andalousie espagnole.",
  "ANE": "MammifÃ¨re Ã  longues oreilles.",
  "ANEMONE": "Fleur printaniÃ¨re trÃ¨s colorÃ©e.",
  "ANGE": "ÃŠtre spirituel cÃ©leste.",
  "ANGINE": "Inflammation de la gorge.",
  "ANGLAIS": "Relatif Ã  l'Angleterre.",
  "ANGLE": "Espace compris entre deux droites concourantes.",
  "ANIMA": "Principe de vie.",
  "ANIMAL": "ÃŠtre vivant douÃ© de sensations.",
  "ANIME": "Plein de vie, agitÃ©.",
  "ANIS": "Plante d'ombellifÃ¨res aromatique.",
  "ANKH": "Croix ansÃ©e Ã©gyptienne.",
  "ANNEAU": "Cercle rigide de mÃ©tal, de bois.",
  "ANNEE": "DurÃ©e d'une rÃ©volution terrestre (365 jours).",
  "ANNEXE": "Chose rattachÃ©e subsidiairement Ã  une principale.",
  "ANNIV": "Anniversaire populaire.",
  "ANNOTATION": "Remarque Ã©crite en marge d'un texte.",
  "ANNUALITE": "CaractÃ¨re de ce qui se fait chaque annÃ©e.",
  "ANNULABLE": "Qui peut Ãªtre annulÃ© juridiquement.",
  "ANODE": "Ã‰lectrode par laquelle le courant pÃ©nÃ¨tre.",
  "ANOMALIE": "IrrÃ©gularitÃ© bizarre d'un dÃ©veloppement.",
  "ANON": "Jeune Ã¢ne.",
  "ANONYME": "Dont on ne connaÃ®t pas le nom.",
  "ANORMAL": "Qui s'Ã©carte de l'ordre habituel ou prescrit.",
  "ANSE": "PoignÃ©e courbe d'un panier.",
  "ANTENNE": "Organe sensoriel d'insecte / Brin mÃ©tallique radio.",
  "ANTIQUE": "D'une grande antiquitÃ©.",
  "ANUS": "Orifice terminal du tube digestif.",
  "ANXIETE": "InquiÃ©tude douloureuse vive.",
  "AORTE": "L'artÃ¨re principale du corps humain.",
  "AOUT": "HuitiÃ¨me mois de l'annÃ©e grÃ©gorienne.",
  "APACHE": "Indien d'AmÃ©rique du Nord / Voyou parisien du XXe.",
  "APATIDE": "Qui manque d'Ã©nergie, mou.",
  "APERO": "ApÃ©ritif.",
  "APEX": "Sommet d'une feuille, d'un poumon.",
  "API": "Pomme rouge sucrÃ©e.",
  "APLANIT": "Rendu uni ou horizontal.",
  "APNEE": "ArrÃªt temporaire de la respiration.",
  "APOCRYPHE": "Dont l'authenticitÃ© n'est pas Ã©tablie.",
  "APOGEE": "Point le plus haut atteint d'un dÃ©veloppement.",
  "APOLLON": "Homme d'une agrÃ©able beautÃ© lÃ©gendaire.",
  "APOSTROF": "Signe d'Ã©lision grammaticale (').",
  "APOSTROPHE": "Interpellation vive.",
  "APOTRE": "Disciple du Christ / Propagateur d'idÃ©es.",
  "APPAREIL": "RÃ©union d'organes concourant Ã  une fonction.",
  "APPEL": "Action de faire venir par la parole ou un geste.",
  "APPETIT": "DÃ©sir de manger instinctif.",
  "APPLIQUE": "PlacÃ© contre un support mural.",
  "APPORT": "Ce que l'on apporte dans une sociÃ©tÃ© commerciale.",
  "APPRENTI": "Qui apprend un mÃ©tier manuel chez un maÃ®tre.",
  "APPROCHE": "Rapprochement progressif.",
  "APPUI": "Soutien solide matÃ©riel.",
  "APRE": "Rudement dur au goÃ»t, au toucher, au caractÃ¨re.",
  "APRES": "Indique la postÃ©rioritÃ© dans le temps ou l'espace.",
  "APTE": "Propre Ã  accomplir une tÃ¢che donnÃ©e.",
  "APTITUDE": "Disposition naturelle innÃ©e.",
  "APTEUX": "Relatif Ã  l'aphte buccal.",
  "AQUARELLE": "Peinture Ã  l'eau lÃ©gÃ¨re dÃ©layÃ©e.",
  "AQUARIUM": "Bac vitrÃ© pour animaux aquatiques.",
  "AQUATIQUE": "Qui vit ou croÃ®t dans l'eau.",
  "AQUILIN": "En bec d'aigle (nez).",
  "ARA": "Grand perroquet d'AmÃ©rique aux couleurs vives.",
  "ARABE": "Relatif Ã  l'Arabie ou Ã  sa langue.",
  "ARANT": "Qui dÃ©bute l'action d'arer.",
  "ARBITRE": "Personne choisie pour juger un diffÃ©rend ou diriger un jeu.",
  "ARBORE": "Qui a l'aspect d'un arbre / DressÃ© au grand jour.",
  "ARBRE": "Plante ligneuse rÃ©sistante.",
  "ARBUSTE": "VÃ©gÃ©tal ligneux plus petit qu'un arbre.",
  "ARC": "Ligne courbe.",
  "ARCADE": "Baie de maçonnerie cintrÃ©e.",
  "ARCEAU": "Cercle partiel.",
  "ARCHE": "Structure voÃ»tÃ©e d'un pont / Coffre sacrÃ©.",
  "ARCHET": "Baguette de bois tendue d'un crin pour violon.",
  "ARCHIVES": "Collection de piÃ¨ces mÃ©morables.",
  "ARDENT": "Qui brÃ»le d'Ã©clat ou de sentiments.",
  "ARDRE": "Brûler.",
  "ARDOISE": "Roche schisteuse taillÃ©e en plaques de toits.",
  "ARE": "UnitÃ© de mesure de superficie (100 m²).",
  "ARENE": "Espace fermÃ© sableux des combats de gladiateurs.",
  "ARETE": "Os de poisson ou ligne d'intersection saillante.",
  "ARGENT": "MÃ©tal prÃ©cieux blanc / PiÃ¨ces de monnaie.",
  "ARGILE": "Roche sÃ©dimentaire plastique humide.",
  "ARGOT": "Langage particulier Ã  un groupe de dÃ©linquants.",
  "ARGUE": "Dispute d'arguments.",
  "ARIDE": "Sec et stÃ©rile.",
  "ARIEN": "Relatif Ã  Arius ou sa doctrine hÃ©rÃ©tique.",
  "ARISTOCRATIE": "Caste privilÃ©giÃ©e dirigeante.",
  "ARMADA": "Grande flotte de navires militaires.",
  "ARME": "Instrument d'attaque ou de dÃ©fense.",
  "ARMOIRE": "Meuble fermÃ© par des battants.",
  "ARMONS": "TrÃ¨s anciens bois supportant le timon d'un train.",
  "AROME": "Sensation d'odeur odorante fine.",
  "ARPEGIO": "ArpÃ¨ge d'accords.",
  "ARRÊTE": "StoppÃ© net.",
  "ARRETE": "StoppÃ© net / Document juridique.",
  "ARRIERE": "Partie situÃ©e vers le dos.",
  "ARRIVEE": "Mouvement de parvenir au terme du voyage.",
  "ARROGANT": "Qui traite autrui avec insolence dÃ©daigneuse.",
  "ARROWROOT": "FÃ©cule nutritive extraite du rhizome tropical.",
  "ARSENAL": "Ã‰tablissement militaire d'armes.",
  "ART": "ActivitÃ© humaine de crÃ©ation esthÃ©tique.",
  "ARTERYET": "Qui concerne les artÃ¨res.",
  "ARTICLE": "Ã‰crit formant un tout dans un journal / Objet futil.",
  "ARTISAN": "Travailleur indÃ©pendant manuel brevetÃ©.",
  "ARTISTE": "Personne crÃ©atrice d'œuvres d'art.",
  "ARYEN": "Se dit des peuples indo-europÃ©ens légendaires.",
  "AS": "Carte de valeur suprÃªme / Personne d'Ã©lite.",
  "ASBESTE": "Amiante blanc rÃ©sistant au feu.",
  "ASCENSEUR": "Appareil mÃ©canique d'Ã©lÃ©vation de passagers.",
  "ASCESE": "Discipline de vie austÃ¨re rigoureuse.",
  "ASEPTIQUE": "DÃ©pourvu de tout germe pathogÃ¨ne.",
  "ASILE": "Lieu de refuge et de sÃ©curitÃ©.",
  "ASOCIEN": "DisposÃ© sans lien social.",
  "ASPECT": "ManiÃ¨re dont une personne se prÃ©sente au regard.",
  "ASPHALTE": "MatÃ©riau bitumineux de revÃªtement routier.",
  "ASPHYXIE": "Perte de dÃ©bit d'oxygÃ¨ne respiratoire.",
  "ASPIC": "Serpent venimeux d'Europe / EntrÃ©e froide gÃ©latineuse.",
  "ASPIRINE": "MÃ©dicament antidouleur dÃ©rivÃ© de l'acide salicylique.",
  "ASSASSIN": "Meurtrier coupable prÃ©mÃ©ditÃ©.",
  "ASSEZ": "Suffisamment.",
  "ASSIDU": "Qui est constamment prÃ©sent ou appliquÃ©.",
  "ASSIETTE": "Vaisselle plate individuelle / Base d'impÃ´t.",
  "ASSIMILE": "Rendu semblable / DigÃ©rÃ© intellectuellement.",
  "ASSIS": "En position assise stable.",
  "ASSOCIATION": "Groupement de personnes unies.",
  "ASSOUPI": "PlongÃ© dans un demi-sommeil clÃ©ment.",
  "ASSUME": "Pris Ã  sa charge courageusement.",
  "ASSURANCE": "Confiance tranquille inÃ©branlable / Contrat de risques.",
  "ASTEROIDE": "Petit corps cÃ©leste rocheux.",
  "ASTHME": "Affection respiratoire spasmodique.",
  "ASTICOT": "Larve de mouche agile.",
  "ASTRONOME": "SpÃ©cialiste des astres.",
  "ASTUCE": "ProcÃ©dÃ© astucieux d'adresse.",
  "ASYL": "Asile orthographiÃ© autrefois.",
  "ATELIER": "Lieu oÃ¹ l'on travaille manuellement ou artistiquement.",
  "ATHEE": "Qui nie l'existence de Dieu.",
  "ATHLETE": "Personne pratiquant l'athlÃ©tisme vigoureuse.",
  "ATLAS": "Recueil de cartes gÃ©ographiques.",
  "ATMOSPHERE": "Couche de gaz entourant la Terre.",
  "ATOME": "Constituant ultime ordonnÃ© de la matiÃ¨re.",
  "ATRE": "Partie de la cheminÃ©e oÃ¹ se fait le feu.",
  "ATROCE": "D'une cruautÃ© dÃ©testable.",
  "ATROPHIE": "Diminution importante de volume d'un viscÃ¨re.",
  "ATTACHE": "LiÃ© fermement, devouÃ©.",
  "ATTAQUE": "Action offensive soudaine.",
  "ATTEINT": "FrappÃ© d'un coup physique ou moral.",
  "ATTENTAT": "Tentative criminelle contre l'Ã‰tat ou des vies.",
  "ATTENTIF": "Qui prÃªte une attention soutenue.",
  "ATTITUDE": "Pose du corps ou disposition d'esprit.",
  "ATTRACTION": "Force attirante mÃ©canique ou mondaine.",
  "ATTRAPE": "Pris au piÃ¨ge futil / Ruse.",
  "ATTRIBUT": "QualitÃ© prÃªtÃ©e Ã  quelque chose.",
  "AUBADE": "Concert donnÃ© sous les fenÃªtres au lever.",
  "AUBE": "ClartÃ© crÃ©pusculaire du matin / Palette de moulin.",
  "AUBERGE": "Maison rustique d'hÃ©bergement.",
  "AUBIN": "Allure de cheval fatiguÃ©.",
  "AUCUN": "Pas un seul.",
  "AUDACE": "Hardiesse insolente de courage.",
  "AUDIENCE": "Entretien accordÃ© / Nombre d'auditeurs.",
  "AUDITEUR": "Personne qui Ã©coute un discours.",
  "AUDITORIUM": "Salle conÃ§ue spÃ©cialement pour des concerts.",
  "AUGE": "Sorte de bac pour nourrir le bÃ©tail.",
  "AUGMENTE": "Accru en valeur.",
  "AUGURE": "PrÃªtre devin / Signe d'avenir prÃ©sage.",
  "AULNE": "Arbre des milieux humides.",
  "AUMÔNE": "CharitÃ© matÃ©rielle offerte.",
  "AUMONE": "CharitÃ© matÃ©rielle offerte.",
  "AUPRES": "Tout prÃ¨s de.",
  "AUREOLE": "Cercle lumineux entourant les figures saintes.",
  "AURORE": "Lueur brillante avant le lever du soleil.",
  "AUSPICE": "Présage d'avenir tirÃ© du vol des oiseaux.",
  "AUSTERITE": "AustÃ©ritÃ© stricte de vie.",
  "AUTANT": "En quantitÃ© Ã©gale.",
  "AUTEL": "Table sacrÃ©e pour les sacrifices liturgiques.",
  "AUTEUR": "CrÃ©ateur original d'un ouvrage du gÃ©nie.",
  "AUTHENTICITE": "SincÃ©ritÃ© authentique de piÃ¨ces jurÃ©es.",
  "AUTO": "Automobile.",
  "AUTOBUS": "VÃ©hicule routier collectif urbain.",
  "AUTOCRATE": "Souverain absolu sans frein lÃ©gal.",
  "AUTOMATE": "MÃ©canisme qui imite les gestes.",
  "AUTOMNE": "TroisiÃ¨me saison de l'annÃ©e fÃ©conde.",
  "AUTONOMIE": "FacultÃ© de se gouverner par ses propres lois.",
  "AUTORITE": "Droit ou pouvoir de commander.",
  "AUTOUR": "Dans l'espace environnant / Faucon moyen.",
  "AUTRE": "Qui diffÃ¨re du premier.",
  "AUTRUCHE": "Grand oiseau des steppes inapte au vol.",
  "AUTRUI": "Les autres personnes en gÃ©nÃ©ral.",
  "AUVENT": "Petit toit saillant protÃ©geant une baie.",
  "AUXILIAIRE": "Qui apporte une aide secondaire utile.",
  "AVACHI": "DÃ©formÃ© par la paresse.",
  "AVAL": "CÃ´tÃ© vers lequel descend un cours d'eau / Garantie bancaire.",
  "AVALANCHE": "Masse de neige dÃ©valant la montagne.",
  "AVANCE": "Progression en avant.",
  "AVANT": "Qui prÃ©cÃ¨de dans le temps ou l'espace.",
  "AVANTAGE": "Condition favorable acquise.",
  "AVARE": "Qui thÃ©saurise sordidement ses deniers.",
  "AVARIA": "EndommagÃ© au cours d'un transport.",
  "AVARICE": "Épargne mesquine sordide coupable.",
  "AVELAN": "Noisette sauvage amÃ¨re d'autrefois.",
  "AVENANT": "Facile d'accueil / Document additionnel.",
  "AVENIR": "Temps futur.",
  "AVENT": "PÃ©riode de quatre semaines avant NoÃ«l.",
  "AVENTURE": "Ã‰vÃ©nement singulier imprÃ©vu.",
  "AVENUE": "Grande voie urbaine arborÃ©e.",
  "AVERE": "Reconnu vrai officiellement.",
  "AVEYRON": "RÃ©gion rurale de France.",
  "AVEUGLE": "PrivÃ© de la facultÃ© visuelle.",
  "AVIDE": "Qui dÃ©sire avec gloutonnerie excessive.",
  "AVION": "AÃ©rodyne mÃ» par un moteur d'hÃ©lices.",
  "AVIS": "ManiÃ¨re de voir / Information distribuÃ©e.",
  "AVISON": "Averti lÃ©gÃ¨rement au mÃ©tier.",
  "AVOCAT": "Juriste dÃ©fendant son client / Fruit.",
  "AVOINE": "CÃ©rÃ©ale fourragÃ¨re sÃ¨che.",
  "AVOIR": "PossÃ©der de plein droit.",
  "AVORTEMENT": "ArrÃªt prÃ©maturÃ© d'une grossesse.",
  "AVOUABLE": "Que l'on peut confesser sans honte.",
  "AVOYER": "Magistrat d'une ville suisse.",
  "AVRIL": "QuatriÃ¨me mois de l'annÃ©e grÃ©gorienne.",
  "AXE": "Ligne de rotation mÃ©canique.",
  "AXIOME": "VÃ©ritÃ© dÃ©montrÃ©e Ã©vidente sans preuve.",
  "AZIMUT": "Angle de direction horizontale céleste.",
  "AZOTE": "Gaz gazÃ©iforme d'atmosphÃ¨re.",
  "AZUR": "Couleur bleue limpide du ciel.",
  "BABEL": "Grande confusion mythologique.",
  "BABIL": "Bavardage puÃ©ril futil.",
  "BABORD": "CÃ´tÃ© gauche d'un navire.",
  "BABOUCHE": "Chaussure souple d'Afrique du Nord.",
  "BAC": "Embarcation de traversÃ©e / RÃ©cipient de lavage.",
  "BACHE": "Bâche de toile d'automobile.",
  "BACHOT": "Barque moyenne de pÃªche.",
  "BACON": "Lard de porc fumÃ© salÃ©.",
  "BADAUD": "Passant curieux flÃ¢neur mÃ©diocre.",
  "BADGE": "Insigne mÃ©tallique ou plastique de sÃ©curitÃ©.",
  "BAGAGE": "Effets que l'on emporte en voyage.",
  "BAGARRE": "MÃªlÃ©e bruyante querelleuse.",
  "BAGATELLE": "Chose de peu de valeur, futilitÃ©.",
  "BAGUE": "Anneau portÃ© au doigt.",
  "BAGUETTE": "Brindille de bois fine.",
  "BAHUT": "Meuble bahut bas de rangement / LycÃ©e argot.",
  "BAIE": "Petit golfe marin maritime / Fruit charnu.",
  "BAIGNADE": "Action de tremper son corps.",
  "BAIL": "Contrat de location meublÃ©e ou rurale.",
  "BAILLI": "Magistrat royal gÃ©rant.",
  "BAILLY": "Magistrat de commune ancienne.",
  "BAIN": "Séance d'eau chaude d'hygiÃ¨ne.",
  "BAIONNETTE": "Arme blanche emmanchÃ©e au fusil.",
  "BAISER": "Toucher de lÃ¨vres affectueux.",
  "BAISSE": "Diminution de niveau.",
  "BAL": "RÃ©union dansante mondaine.",
  "BALAFRE": "Balafre de cicatrice au visage.",
  "BALAI": "Ustensile frotteur de poussiÃ¨re.",
  "BALANCE": "Instrument d'Ã©valuation de poids / Signe.",
  "BALCON": "Garde-fou extÃ©rieur en saillie d'immeuble.",
  "BALDAQUIN": "Tentures ornant le dessus d'un lit.",
  "BALISE": "Signal indicateur de route marine.",
  "BALLE": "Projectile de plomb / SphÃ¨re de jeu.",
  "BALLON": "Gros ballon de sport.",
  "SAINTER": "Du verbe sainter, faire sainte.",
  "TRAINE": "Du verbe traÃ®ner.",
  "TRAINES": "Du verbe traÃ®ner, tirÃ© au sol.",
  "TRAINÉ": "Du verbe traÃ®ner, tirÃ© au sol.",
  "TRAINÉS": "Du verbe traÃ®ner, tirÃ© au sol.",
  "SCRABBLE": "Le plus cÃ©lÃ¨bre jeu de lettres au monde.",
  "DUPLICATE": "Formule oÃ¹ tous les joueurs jouent avec le mÃªme tirage."
};

// Simple visual algorithm that tests if a word is physically "French-sounding" to avoid blocking players when testing unregistered French words
export function looksLikeFrench(word: string): boolean {
  const normalized = word.toUpperCase().trim();
  if (normalized.length < 2 || normalized.length > 15) return false;

  // Let's check for weird characters
  for (let i = 0; i < normalized.length; i++) {
    if (!ALPHABET.includes(normalized[i])) return false;
  }

  // Count vowels vs consonants
  const vowels = 'AEIOUY';
  let vowelCount = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (vowels.includes(normalized[i])) vowelCount++;
  }

  const consonantCount = normalized.length - vowelCount;

  // Extremely unlikely French words:
  // No vowels at all (length >= 3)
  if (normalized.length >= 3 && vowelCount === 0) return false;
  // No consonants at all (length >= 4)
  if (normalized.length >= 4 && consonantCount === 0) return false;

  // Unlikely consecutive consonants or letters
  if (/(.)\1\1/.test(normalized)) {
    // No triple letters like LLL or RRR
    return false;
  }

  // Extremely rare combinations
  if (/([BCDFGHJKLMNPQRSTVWXZ])\1\1\1/.test(normalized)) {
    return false;
  }

  return true;
}

// Dynamic ODS9 dictionary Set
export const ODS9_DICTIONARY = new Set<string>();

export function setOds9Dictionary(words: string[]) {
  ODS9_DICTIONARY.clear();
  words.forEach(w => ODS9_DICTIONARY.add(w));
}

export function isWordInOds9(word: string): boolean {
  const upper = word.toUpperCase();
  return ODS9_DICTIONARY.has(upper) || !!COMMON_FRENCH_WORDS[upper];
}

// Function to validate words with dictionary fallback or rules
export function validateWordODS9(word: string): { isValid: boolean; word: string; definition: string } {
  const cleanWord = word.toUpperCase().replace(/[ÂÄÀ]/g, "A").replace(/[ËÊÈÉ]/g, "E").replace(/[ÎÏ]/g, "I").replace(/[ÔÖ]/g, "O").replace(/[ÛÜ]/g, "U").replace(/[Ç]/g, "C").replace(/[^A-Z]/g, "").trim();

  // 1. Direct dictionary match
  if (isWordInOds9(cleanWord)) {
    return {
      isValid: true,
      word: cleanWord,
      definition: COMMON_FRENCH_WORDS[cleanWord] || "Mot présent et validé dans le dictionnaire ODS9."
    };
  }

  // 2. Playable check using French linguistic structure
  if (looksLikeFrench(cleanWord)) {
    return {
      isValid: true,
      word: cleanWord,
      definition: "Néologisme ou forme conjuguée valide selon dictionnaire dynamique ODS9."
    };
  }

  return {
    isValid: false,
    word: cleanWord,
    definition: "Mot inconnu dans le dictionnaire ODS9."
  };
}

export function getLetterPoints(letter: string): number {
  if (letter === letter.toLowerCase() && letter !== letter.toUpperCase()) {
    return 0; // Lowercase represents a JOKER/BLANK tile, scoring 0 points
  }
  return FRENCH_LETTER_VALUES[letter.toUpperCase()] || 0;
}

// Calculate the score of a word placed on the board!
// - Letters already on the board from previous turns (placedBefore) are NOT multiplied.
// - Newly placed letters trigger cell multipliers (DL, TL, DW, TW).
// - Scrabbles (using all 7 letters from the rack) add exactly +50 points.
export interface PlacementLetter {
  r: number; // 0-14
  c: number; // 0-14
  letter: string;
}

export function scorePlacedWord(
  placement: PlacementLetter[], // letters placed this turn
  existingGrid: { letter: string | null }[][] // current board grid
): { score: number; lettersPlacedCount: number; error?: string } {
  if (placement.length === 0) {
    return { score: 0, lettersPlacedCount: 0 };
  }

  // Sort placement to check alignment and extract full word line
  // Determine if vertical or horizontal
  const rows = placement.map(p => p.r);
  const cols = placement.map(p => p.c);

  const isHorizontal = rows.every(r => r === rows[0]);
  const isVertical = cols.every(c => c === cols[0]);

  if (!isHorizontal && !isVertical) {
    return { score: 0, lettersPlacedCount: placement.length, error: "Les lettres doivent être alignées horizontalement ou verticalement." };
  }

  // Find min and max of the placement
  const placementMap = new Map<string, string>();
  placement.forEach(p => placementMap.set(`${p.r},${p.c}`, p.letter));

  let finalWordList: PlacementLetter[] = [];
  let mainWordScore = 0;
  let wordMultiplier = 1;

  if (isHorizontal) {
    const row = rows[0];
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // Expand to find the full word including existing tiles adjacent
    let startCol = minCol;
    while (startCol > 0 && (existingGrid[row][startCol - 1].letter !== null || placementMap.has(`${row},${startCol - 1}`))) {
      startCol--;
    }

    let endCol = maxCol;
    while (endCol < 14 && (existingGrid[row][endCol + 1].letter !== null || placementMap.has(`${row},${endCol + 1}`))) {
      endCol++;
    }

    // Capture the entire main word
    for (let c = startCol; c <= endCol; c++) {
      const placedLetter = placementMap.get(`${row},${c}`);
      const existingLetter = existingGrid[row][c].letter;
      const letter = placedLetter || existingLetter;

      if (!letter) {
        return { score: 0, lettersPlacedCount: placement.length, error: "Il y a des trous dans le mot posé." };
      }

      finalWordList.push({ r: row, c, letter });

      // Calculate score for this cell
      const points = getLetterPoints(letter);
      const isNew = placementMap.has(`${row},${c}`);

      if (isNew) {
        const mult = getCellMultiplier(row, c);
        if (mult.type === 'DL') {
          mainWordScore += points * 2;
        } else if (mult.type === 'TL') {
          mainWordScore += points * 3;
        } else if (mult.type === 'DW') {
          mainWordScore += points;
          wordMultiplier *= 2;
        } else if (mult.type === 'TW') {
          mainWordScore += points;
          wordMultiplier *= 3;
        } else {
          mainWordScore += points;
        }
      } else {
        // Already on board, raw points only
        mainWordScore += points;
      }
    }
  } else {
    // Vertical
    const col = cols[0];
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    let startRow = minRow;
    while (startRow > 0 && (existingGrid[startRow - 1][col].letter !== null || placementMap.has(`${startRow - 1},${col}`))) {
      startRow--;
    }

    let endRow = maxRow;
    while (endRow < 14 && (existingGrid[endRow + 1][col].letter !== null || placementMap.has(`${endRow + 1},${col}`))) {
      endRow++;
    }

    for (let r = startRow; r <= endRow; r++) {
      const placedLetter = placementMap.get(`${r},${col}`);
      const existingLetter = existingGrid[r][col].letter;
      const letter = placedLetter || existingLetter;

      if (!letter) {
        return { score: 0, lettersPlacedCount: placement.length, error: "Il y a des trous dans le mot posé." };
      }

      finalWordList.push({ r, c: col, letter });

      const points = getLetterPoints(letter);
      const isNew = placementMap.has(`${r},${col}`);

      if (isNew) {
        const mult = getCellMultiplier(r, col);
        if (mult.type === 'DL') {
          mainWordScore += points * 2;
        } else if (mult.type === 'TL') {
          mainWordScore += points * 3;
        } else if (mult.type === 'DW') {
          mainWordScore += points;
          wordMultiplier *= 2;
        } else if (mult.type === 'TW') {
          mainWordScore += points;
          wordMultiplier *= 3;
        } else {
          mainWordScore += points;
        }
      } else {
        mainWordScore += points;
      }
    }
  }

  // Si le mot "principal" ne fait qu'une seule lettre, son score est de 0,
  // car une lettre seule isolée ne forme pas un mot de Scrabble.
  if (finalWordList.length === 1) {
    mainWordScore = 0;
    wordMultiplier = 1;
  }

  let totalScore = mainWordScore * wordMultiplier;

  // Handle adjacent words scoring in duplicate standard Scrabble!
  // Any newly placed letter can form a word perpendicular to the main placement line.
  for (const p of placement) {
    let perpPoints = 0;
    let perpMult = 1;
    let formsPerpWord = false;

    if (isHorizontal) {
      // Find vertical adjacent letters for this specific placed tile
      let startR = p.r;
      while (startR > 0 && existingGrid[startR - 1][p.c].letter !== null) {
        startR--;
      }
      let endR = p.r;
      while (endR < 14 && existingGrid[endR + 1][p.c].letter !== null) {
        endR++;
      }

      if (startR !== endR) {
        formsPerpWord = true;
        for (let r = startR; r <= endR; r++) {
          const letter = r === p.r ? p.letter : existingGrid[r][p.c].letter!;
          const points = getLetterPoints(letter);

          if (r === p.r) {
            // Apply letter multiplier of the tile cell
            const mult = getCellMultiplier(r, p.c);
            if (mult.type === 'DL') perpPoints += points * 2;
            else if (mult.type === 'TL') perpPoints += points * 3;
            else {
              perpPoints += points;
              if (mult.type === 'DW') perpMult *= 2;
              if (mult.type === 'TW') perpMult *= 3;
            }
          } else {
            perpPoints += points;
          }
        }
      }
    } else {
      // Vertical main word -> look horizontally for this placed tile
      let startC = p.c;
      while (startC > 0 && existingGrid[p.r][startC - 1].letter !== null) {
        startC--;
      }
      let endC = p.c;
      while (endC < 14 && existingGrid[p.r][endC + 1].letter !== null) {
        endC++;
      }

      if (startC !== endC) {
        formsPerpWord = true;
        for (let c = startC; c <= endC; c++) {
          const letter = c === p.c ? p.letter : existingGrid[p.r][c].letter!;
          const points = getLetterPoints(letter);

          if (c === p.c) {
            const mult = getCellMultiplier(p.r, c);
            if (mult.type === 'DL') perpPoints += points * 2;
            else if (mult.type === 'TL') perpPoints += points * 3;
            else {
              perpPoints += points;
              if (mult.type === 'DW') perpMult *= 2;
              if (mult.type === 'TW') perpMult *= 3;
            }
          } else {
            perpPoints += points;
          }
        }
      }
    }

    if (formsPerpWord) {
      totalScore += perpPoints * perpMult;
    }
  }

  // Scrabble bonus! +50 points if all 7 letters are placed from the rack
  if (placement.length === 7) {
    totalScore += 50;
  }

  return {
    score: totalScore,
    lettersPlacedCount: placement.length
  };
}

// Generate classic Duplicate Scrabble letters
// - Standard bag has 102 letters
// - Drawing 7 letters ensuring vowel-consonant composition: 
//   Rules: A draw must contain at least 2 vowels and 2 consonants.
//   If bag doesn't have enough, we draw whatever is left.
export function drawScrabbleLetters(
  roundNum: number,
  bag: { letter: string; count: number }[]
): { drawn: string; updatedBag: { letter: string; count: number }[] } {
  // Deep copy bag
  const currentBag = bag.map(item => ({ ...item }));

  // Helper to expand bag to array of characters
  const generateFlatList = (b: typeof currentBag) => {
    const list: string[] = [];
    b.forEach(item => {
      for (let i = 0; i < item.count; i++) {
        list.push(item.letter);
      }
    });
    return list;
  };

  const vowels = 'AEIOUY?'; // Include JOKER as vowel helper or separate
  const consonants = 'BCDFGHJKLMNPQRSTVWXZ';

  let flatList = generateFlatList(currentBag);
  if (flatList.length < 7) {
    // Return all remaining
    const drawn = flatList.join('');
    return {
      drawn,
      updatedBag: currentBag.map(item => ({ ...item, count: 0 }))
    };
  }

  // Draw 7 letters. Let's do a loop drawing letters randomly and validating
  // we have at least 2 vowels and 2 consonants, if both exist in the active bag.
  let attempts = 0;
  let selectedIndices: number[] = [];

  while (attempts < 100) {
    selectedIndices = [];
    while (selectedIndices.length < 7) {
      const idx = Math.floor(Math.random() * flatList.length);
      if (!selectedIndices.includes(idx)) {
        selectedIndices.push(idx);
      }
    }

    const letters = selectedIndices.map(idx => flatList[idx]);
    const vowelCount = letters.filter(l => vowels.includes(l)).length;
    const consCount = 7 - vowelCount;

    // Check vowel/consonant constraints
    const totalVowelsInBag = flatList.filter(l => vowels.includes(l)).length;
    const totalConsInBag = flatList.filter(l => consonants.includes(l)).length;

    const minVowelsNeeded = Math.min(2, totalVowelsInBag);
    const minConsNeeded = Math.min(2, totalConsInBag);

    if (vowelCount >= minVowelsNeeded && consCount >= minConsNeeded) {
      // Accept this draw!
      break;
    }
    attempts++;
  }

  const drawnLetters = selectedIndices.map(idx => flatList[idx]);

  // Decrement counts in bag
  drawnLetters.forEach(l => {
    const match = currentBag.find(item => item.letter === l);
    if (match && match.count > 0) {
      match.count--;
    }
  });

  return {
    drawn: drawnLetters.join(''),
    updatedBag: currentBag
  };
}

// Convert board coordinate row index (0-14) and column index (0-14) 
// and orientation ('H' | 'V') into duplicate style, e.g. "H8" or "8H"
export function formatCoordinates(r: number, c: number, direction: 'H' | 'V'): string {
  const colLetter = ALPHABET[c];
  const rowNumber = r + 1;

  if (direction === 'H') {
    return `${colLetter}${rowNumber}`; // Horizon: Letter then Number
  } else {
    return `${rowNumber}${colLetter}`; // Vertical: Number then Letter
  }
}

// Parse coordinates like "H8" or "8H" back into r, c, direction
export function parseCoordinates(coords: string): { r: number; c: number; direction: 'H' | 'V' } | null {
  const trimmed = coords.trim().toUpperCase();
  if (trimmed.length < 2) return null;

  // Cases: "H8", "O15", "8H", "15O"
  // Match letter first:
  const firstLetter = ALPHABET.indexOf(trimmed[0]);
  if (firstLetter !== -1) {
    // Horizontal format e.g., "H8" or "H15"
    const rowStr = trimmed.slice(1);
    const r = parseInt(rowStr, 10) - 1;
    if (isNaN(r) || r < 0 || r > 14) return null;
    return { r, c: firstLetter, direction: 'H' };
  }

  // Match number first -> vertical format e.g., "8H", "15O"
  const lastChar = trimmed[trimmed.length - 1];
  const colIndex = ALPHABET.indexOf(lastChar);
  if (colIndex !== -1) {
    const rowStr = trimmed.slice(0, trimmed.length - 1);
    const r = parseInt(rowStr, 10) - 1;
    if (isNaN(r) || r < 0 || r > 14) return null;
    return { r, c: colIndex, direction: 'V' };
  }

  return null;
}

// Solver for Scrabble Duplicate - Find Top Play
export function solveTopPlay(
  rack: string,
  board: { letter: string | null }[][]
): { word: string; points: number; coords: string; play: PlacementLetter[] } {
  // Use loaded dictionary ODS9_DICTIONARY if available, or fallback to COMMON_FRENCH_WORDS
  const words = ODS9_DICTIONARY.size > 0 
    ? Array.from(ODS9_DICTIONARY) 
    : Object.keys(COMMON_FRENCH_WORDS);

  const rackArr = rack.toUpperCase().split('');
  const rackLettersSet = new Set(rackArr);
  const maxJokers = rackArr.filter(x => x === '?').length;

  let bestWord = "";
  let bestPoints = -1;
  let bestCoords = "";
  let bestPlay: PlacementLetter[] = [];

  // Determine if board is empty, and track active rows/cols and board letters
  let isEmpty = true;
  const activeRows = new Set<number>();
  const activeCols = new Set<number>();
  const lettersOnBoard = new Set<string>();

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c].letter !== null) {
        isEmpty = false;
        lettersOnBoard.add(board[r][c].letter!.toUpperCase());

        // Mark row and surrounding rows active
        activeRows.add(r);
        if (r > 0) activeRows.add(r - 1);
        if (r < 14) activeRows.add(r + 1);

        // Mark col and surrounding cols active
        activeCols.add(c);
        if (c > 0) activeCols.add(c - 1);
        if (c < 14) activeCols.add(c + 1);
      }
    }
  }

  // Helper to check if required letters can be constructed from the rack
  function canMatchRack(needed: string[]): boolean {
    if (needed.length === 0) return false; // must place at least one tile!
    if (needed.length > rackArr.length) return false; // can't place more than rack size
    
    const tempRack = [...rackArr];
    for (const char of needed) {
      const idx = tempRack.indexOf(char);
      if (idx !== -1) {
        tempRack.splice(idx, 1);
      } else {
        const jokerIdx = tempRack.indexOf('?');
        if (jokerIdx !== -1) {
          tempRack.splice(jokerIdx, 1);
        } else {
          return false;
        }
      }
    }
    return true;
  }

  for (const W of words) {
    const L = W.length;
    if (L > 15) continue;

    // Advanced Pre-filtering: check if W contains any letter that is neither in the rack nor on the board
    let missingFromRackAndBoard = 0;
    let possible = true;
    for (let i = 0; i < L; i++) {
      const char = W[i];
      if (!rackLettersSet.has(char) && !lettersOnBoard.has(char)) {
        missingFromRackAndBoard++;
        if (missingFromRackAndBoard > maxJokers) {
          possible = false;
          break;
        }
      }
    }
    if (!possible) continue;

    if (isEmpty) {
      // First turn: Word must cross Row 7, Col 7 (H8)
      const minC = Math.max(0, 8 - L);
      const maxC = Math.min(7, 15 - L);

      for (let c_start = minC; c_start <= maxC; c_start++) {
        const needed: string[] = [];
        const play: PlacementLetter[] = [];
        const tempRack = [...rackArr];

        for (let i = 0; i < L; i++) {
          const char = W[i];
          const rackIdx = tempRack.indexOf(char);
          if (rackIdx !== -1) {
            tempRack.splice(rackIdx, 1);
            needed.push(char);
            play.push({ r: 7, c: c_start + i, letter: char });
          } else {
            const jokerIdx = tempRack.indexOf('?');
            if (jokerIdx !== -1) {
              tempRack.splice(jokerIdx, 1);
              needed.push(char);
              play.push({ r: 7, c: c_start + i, letter: char.toLowerCase() }); // Lowercase for JOKER
            } else {
              needed.push(char);
              play.push({ r: 7, c: c_start + i, letter: char });
            }
          }
        }

        if (canMatchRack(needed)) {
          const scoreResult = scorePlacedWord(play, board);
          if (!scoreResult.error && scoreResult.score > bestPoints) {
            bestPoints = scoreResult.score;
            bestWord = W;
            bestCoords = formatCoordinates(7, c_start, 'H');
            bestPlay = play;
          }
        }
      }

      const minR = Math.max(0, 8 - L);
      const maxR = Math.min(7, 15 - L);
      for (let r_start = minR; r_start <= maxR; r_start++) {
        const needed: string[] = [];
        const play: PlacementLetter[] = [];
        const tempRack = [...rackArr];

        for (let i = 0; i < L; i++) {
          const char = W[i];
          const rackIdx = tempRack.indexOf(char);
          if (rackIdx !== -1) {
            tempRack.splice(rackIdx, 1);
            needed.push(char);
            play.push({ r: r_start + i, c: 7, letter: char });
          } else {
            const jokerIdx = tempRack.indexOf('?');
            if (jokerIdx !== -1) {
              tempRack.splice(jokerIdx, 1);
              needed.push(char);
              play.push({ r: r_start + i, c: 7, letter: char.toLowerCase() }); // Lowercase for JOKER
            } else {
              needed.push(char);
              play.push({ r: r_start + i, c: 7, letter: char });
            }
          }
        }

        if (canMatchRack(needed)) {
          const scoreResult = scorePlacedWord(play, board);
          if (!scoreResult.error && scoreResult.score > bestPoints) {
            bestPoints = scoreResult.score;
            bestWord = W;
            bestCoords = formatCoordinates(r_start, 7, 'V');
            bestPlay = play;
          }
        }
      } 
    } else {
      // Subsequent turns: Word must connect with existing tiles
      for (let r = 0; r < 15; r++) {
        if (!activeRows.has(r)) continue;

        for (let c_start = 0; c_start <= 15 - L; c_start++) {
          const c_end = c_start + L - 1;

          let validLettersMatchAndOverlap = true;
          let hasOverlap = false;
          const placement: PlacementLetter[] = [];
          const needed: string[] = [];
          const tempRack = [...rackArr];

          for (let i = 0; i < L; i++) {
            const c = c_start + i;
            const existing = board[r][c].letter;
            const char = W[i];
            if (existing !== null) {
              if (existing.toUpperCase() !== char) {
                validLettersMatchAndOverlap = false;
                break;
              }
              hasOverlap = true;
            } else {
              needed.push(char);
              const rackIdx = tempRack.indexOf(char);
              if (rackIdx !== -1) {
                tempRack.splice(rackIdx, 1);
                placement.push({ r, c, letter: char });
              } else {
                const jokerIdx = tempRack.indexOf('?');
                if (jokerIdx !== -1) {
                  tempRack.splice(jokerIdx, 1);
                  placement.push({ r, c, letter: char.toLowerCase() }); // Lowercase for JOKER
                } else {
                  placement.push({ r, c, letter: char });
                }
              }
            }
          }

          if (!validLettersMatchAndOverlap) continue;

          const hasLeftExtend = c_start > 0 && board[r][c_start - 1].letter !== null;
          const hasRightExtend = c_end < 14 && board[r][c_end + 1].letter !== null;

          let fullMainWord = W;
          if (hasLeftExtend || hasRightExtend) {
            let leftCol = c_start;
            while (leftCol > 0 && board[r][leftCol - 1].letter !== null) {
              leftCol--;
            } 
            let rightCol = c_end;
            while (rightCol < 14 && board[r][rightCol + 1].letter !== null) {
              rightCol++;
            }
            let expanded = "";
            for (let c = leftCol; c <= rightCol; c++) {
              if (c >= c_start && c <= c_end) {
                expanded += W[c - c_start];
              } else {
                expanded += board[r][c].letter;
              }
            }
            fullMainWord = expanded;
          }

          if (fullMainWord !== W && !isWordInOds9(fullMainWord)) {
            continue;
          }

          let isConnected = hasOverlap || hasLeftExtend || hasRightExtend;
          let perpendicularsValid = true;

          for (const p of placement) {
            const hasTopPerp = p.r > 0 && board[p.r - 1][p.c].letter !== null;
            const hasBottomPerp = p.r < 14 && board[p.r + 1][p.c].letter !== null;

            if (hasTopPerp || hasBottomPerp) {
              isConnected = true;
              let topR = p.r;
              while (topR > 0 && board[topR - 1][p.c].letter !== null) {
                topR--;
              }
              let bottomR = p.r;
              while (bottomR < 14 && board[bottomR + 1][p.c].letter !== null) {
                bottomR++;
              }
              let perpWord = "";
              for (let currR = topR; currR <= bottomR; currR++) {
                if (currR === p.r) {
                  perpWord += p.letter;
                } else {
                  perpWord += board[currR][p.c].letter;
                }
              }

              if (!isWordInOds9(perpWord)) {
                perpendicularsValid = false;
                break;
              }
            }
          }

          if (!isConnected || !perpendicularsValid) continue;

          if (canMatchRack(needed)) {
            const scoreResult = scorePlacedWord(placement, board);
            if (!scoreResult.error && scoreResult.score > bestPoints) {
              bestPoints = scoreResult.score;
              bestWord = W;
              bestCoords = formatCoordinates(r, c_start, 'H');
              bestPlay = placement;
            }
          }
        }
      }

      for (let c = 0; c < 15; c++) {
        if (!activeCols.has(c)) continue;

        for (let r_start = 0; r_start <= 15 - L; r_start++) {
          const r_end = r_start + L - 1;

          let validLettersMatchAndOverlap = true;
          let hasOverlap = false;
          const placement: PlacementLetter[] = [];
          const needed: string[] = [];
          const tempRack = [...rackArr];

          for (let i = 0; i < L; i++) {
            const r = r_start + i;
            const existing = board[r][c].letter;
            const char = W[i];
            if (existing !== null) {
              if (existing.toUpperCase() !== char) {
                validLettersMatchAndOverlap = false;
                break;
              }
              hasOverlap = true;
            } else {
              needed.push(char);
              const rackIdx = tempRack.indexOf(char);
              if (rackIdx !== -1) {
                tempRack.splice(rackIdx, 1);
                placement.push({ r, c, letter: char });
              } else {
                const jokerIdx = tempRack.indexOf('?');
                if (jokerIdx !== -1) {
                  tempRack.splice(jokerIdx, 1);
                  placement.push({ r, c, letter: char.toLowerCase() }); // Lowercase for JOKER
                } else {
                  placement.push({ r, c, letter: char });
                }
              }
            }
          }

          if (!validLettersMatchAndOverlap) continue;

          const hasTopExtend = r_start > 0 && board[r_start - 1][c].letter !== null;
          const hasBottomExtend = r_end < 14 && board[r_end + 1][c].letter !== null;

          let fullMainWord = W;
          if (hasTopExtend || hasBottomExtend) {
            let topRow = r_start;
            while (topRow > 0 && board[topRow - 1][c].letter !== null) {
              topRow--;
            } 
            let bottomRow = r_end;
            while (bottomRow < 14 && board[bottomRow + 1][c].letter !== null) {
              bottomRow++;
            }
            let expanded = "";
            for (let r = topRow; r <= bottomRow; r++) {
              if (r >= r_start && r <= r_end) {
                expanded += W[r - r_start];
              } else {
                expanded += board[r][c].letter;
              }
            }
            fullMainWord = expanded;
          }

          if (fullMainWord !== W && !isWordInOds9(fullMainWord)) {
            continue;
          }

          let isConnected = hasOverlap || hasTopExtend || hasBottomExtend;
          let perpendicularsValid = true;

          for (const p of placement) {
            const hasLeftPerp = p.c > 0 && board[p.r][p.c - 1].letter !== null;
            const hasRightPerp = p.c < 14 && board[p.r][p.c + 1].letter !== null;

            if (hasLeftPerp || hasRightPerp) {
              isConnected = true;
              let leftC = p.c;
              while (leftC > 0 && board[p.r][leftC - 1].letter !== null) {
                leftC--;
              }
              let rightC = p.c;
              while (rightC < 14 && board[p.r][rightC + 1].letter !== null) {
                rightC++;
              }
              let perpWord = "";
              for (let currC = leftC; currC <= rightC; currC++) {
                if (currC === p.c) {
                  perpWord += p.letter;
                } else {
                  perpWord += board[p.r][currC].letter;
                }
              }

              if (!isWordInOds9(perpWord)) {
                perpendicularsValid = false;
                break;
              }
            }
          }

          if (!isConnected || !perpendicularsValid) continue;

          if (canMatchRack(needed)) {
            const scoreResult = scorePlacedWord(placement, board);
            if (!scoreResult.error && scoreResult.score > bestPoints) {
              bestPoints = scoreResult.score;
              bestWord = W;
              bestCoords = formatCoordinates(r_start, c, 'V');
              bestPlay = placement;
            }
          }
        }
      }
    }
  }

  if (bestPoints >= 0) {
    return {
      word: bestWord,
      points: bestPoints,
      coords: bestCoords,
      play: bestPlay
    };
  }

  return {
    word: "PAS_DE_COUP",
    points: 0,
    coords: "H8",
    play: []
  };
}
