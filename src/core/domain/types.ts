/**
 * @file types.ts
 * @description Modèle de données du domaine (Couche Core / Hexagone)
 */

export type PackageFormat = 'CMS/SMD' | 'Traversant/DIP' | 'Module';
export type AcquisitionSource = 'Neuf' | 'Récupération' | 'Surplus';

/**
 * Normalise de manière stricte le format de boîtier (PackageFormat) d'un composant
 * à partir de sa valeur brute et/ou de son empreinte (footprint).
 */
export function normalizePackageFormat(pkg?: string, footprint?: string): PackageFormat {
  if (!pkg && !footprint) return 'CMS/SMD';
  const strPkgUpper = String(pkg || '').trim().toUpperCase();
  const strFpUpper = String(footprint || '').trim().toUpperCase();

  if (
    strPkgUpper === 'MODULE' ||
    strPkgUpper.includes('MODULE') ||
    strFpUpper.includes('MODULE') ||
    strFpUpper.includes('SOLÉNOÏDE') ||
    strFpUpper.includes('SOLENOIDE') ||
    strFpUpper.includes('FADER') ||
    strFpUpper.includes('STANTON') ||
    strFpUpper.includes('CYLINDRE DC') ||
    strFpUpper.includes('CARTE PCB')
  ) {
    return 'Module';
  }

  if (
    strPkgUpper === 'TRAVERSANT/DIP' ||
    strPkgUpper === 'DIP' ||
    strPkgUpper === 'TRAVERSANT' ||
    strPkgUpper.includes('DIP') ||
    strPkgUpper.includes('TRAVERSANT') ||
    strPkgUpper.includes('THT') ||
    strPkgUpper.includes('THROUGH') ||
    strFpUpper.includes('DIP') ||
    strFpUpper.includes('TO-92') ||
    strFpUpper.includes('TO-220') ||
    strFpUpper.includes('DO-41') ||
    strFpUpper.includes('DO-35') ||
    strFpUpper.includes('HC-49') ||
    strFpUpper.includes('RADIAL') ||
    strFpUpper.includes('AXIAL') ||
    strFpUpper.includes('ROTATIF') ||
    strFpUpper.includes('TRIMMER')
  ) {
    return 'Traversant/DIP';
  }

  if (
    strPkgUpper === 'CMS/SMD' ||
    strPkgUpper === 'CMS' ||
    strPkgUpper === 'SMD' ||
    strPkgUpper.includes('CMS') ||
    strPkgUpper.includes('SMD') ||
    strFpUpper.includes('SOIC') ||
    strFpUpper.includes('SOP') ||
    strFpUpper.includes('SOT') ||
    strFpUpper.includes('QFP') ||
    strFpUpper.includes('QFN') ||
    strFpUpper.includes('TSSOP') ||
    strFpUpper.includes('MSOP') ||
    strFpUpper.includes('0805') ||
    strFpUpper.includes('0603') ||
    strFpUpper.includes('0402') ||
    strFpUpper.includes('1206')
  ) {
    return 'CMS/SMD';
  }

  return 'CMS/SMD';
}

export interface ElectronicComponent {
  id: string;                      // Identifiant unique invariant (UUID v4)
  ref: string;                     // Marquage / référence exacte (ex: 74HC595, NE555)
  family: string;                  // Famille logique / analogique (ex: 74xx, OpAmp, LDO)
  type: string;                    // Type fonctionnel (ex: Registre à décalage)
  pins: string;                    // Nombre ou type de broches (ex: 16, 8, TO-220-3)
  footprint: string;               // Boîtier normalisé (ex: SOIC-16, DIP-8, TO-220, SOT-223, 0805)
  category: string;                // Catégorie (Logique, Analogique, Alimentation, Discrets, etc.)
  package: PackageFormat;          // Type physique de montage
  source?: AcquisitionSource;      // Mode d'acquisition / provenance (Neuf, Récupération, Surplus)
  functionDesc: string;            // Fonction principale (ex: Entrée série / Sorties parallèles)
  description: string;             // Notes d'application / projets
  quantity: number;                // Stock physique disponible
  minQuantity: number;             // Seuil d'alerte de réapprovisionnement
  location: string;                // Emplacement en atelier (ex: "Casier A-03", "Tiroir CMS-01")
  datasheetUrl?: string;           // Lien web vers documentation technique
  imageUrl?: string;               // Photo du composant (Data URL Base64 / Blob)
  updatedAt: number;               // Horodatage Epoch (ms)
}

export interface StockMetrics {
  totalReferences: number;
  totalQuantity: number;
  cmsCount: number;         // Somme des pièces physiques CMS / SMD
  cmsRefsCount: number;     // Nombre de références uniques CMS / SMD
  dipCount: number;         // Somme des pièces physiques Traversant / DIP
  dipRefsCount: number;     // Nombre de références uniques Traversant / DIP
  moduleCount: number;      // Somme des pièces physiques Modules
  moduleRefsCount: number;  // Nombre de références uniques Modules
  categoriesCount: number;
  lowStockCount: number;
}

export interface InventoryFilter {
  search: string;
  category: string;
  packageType: string;
  lowStockOnly: boolean;
  sortBy: 'ref' | 'family' | 'type' | 'quantity' | 'location' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

export const WORKSHOP_MACRO_CATEGORIES = [
  'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
  'Passifs (Résistances, Condensateurs)',
  'Circuits Intégrés & Logique',
  'Connectique',
  'Modules & Alimentation',
  'Capteurs & Actuateurs',
  'Divers'
] as const;

export type MacroCategory = typeof WORKSHOP_MACRO_CATEGORIES[number];
export const CATEGORIES_LIST = WORKSHOP_MACRO_CATEGORIES;

export function normalizeCategory(raw?: string, family?: string, type?: string, ref?: string): MacroCategory {
  if (!raw && !family && !type && !ref) return 'Divers';
  const cleanRaw = String(raw || '').trim();
  if ((WORKSHOP_MACRO_CATEGORIES as readonly string[]).includes(cleanRaw)) {
    return cleanRaw as MacroCategory;
  }
  const s = `${cleanRaw} ${family || ''} ${type || ''} ${ref || ''}`.toLowerCase();

  // 1. Connectique
  if (
    s.includes('connecteur') ||
    s.includes('audio (xlr') ||
    s.includes('bnc') ||
    s.includes('coaxial') ||
    s.includes('jack') ||
    s.includes('rca') ||
    s.includes('bornier') ||
    s.includes('embase')
  ) {
    return 'Connectique';
  }

  // 2. Capteurs & Actuateurs
  if (
    s.includes('capteur') ||
    s.includes('hall') ||
    s.includes('moteur') ||
    s.includes('solénoïde') ||
    s.includes('solenoide') ||
    s.includes('fader motorisé') ||
    s.includes('fader motorise') ||
    s.includes('direct drive') ||
    s.includes('relais') ||
    s.includes('actuateur') ||
    s.includes('peltier')
  ) {
    return 'Capteurs & Actuateurs';
  }

  // 3. Semi-conducteurs
  if (
    s.includes('mosfet') ||
    s.includes('diode') ||
    s.includes('transistor') ||
    s.includes('schottky') ||
    s.includes('pont de diode') ||
    s.includes('ponts redresseur') ||
    s.includes('redressement') ||
    s.includes('bjt') ||
    s.includes('tl431') ||
    s.includes('led 5mm') ||
    s.includes('optocoupleur')
  ) {
    return 'Semi-conducteurs (Diodes, Transistors, MOSFETs)';
  }

  // 4. Circuits Intégrés & Logique
  if (
    s.includes('74xx') ||
    s.includes('registre à décalage') ||
    s.includes('registre a decalage') ||
    s.includes('buffer') ||
    s.includes('schmitt') ||
    s.includes('aop') ||
    s.includes('amplificateur') ||
    s.includes('eeprom') ||
    s.includes('mémoire') ||
    s.includes('memoire') ||
    s.includes('pmic') ||
    s.includes('power switch') ||
    s.includes('sp2701') ||
    s.includes('30518') ||
    s.includes('ne555') ||
    s.includes('timer') ||
    s.includes('démultiplexeur') ||
    s.includes('demultiplexeur') ||
    s.includes('décodeur') ||
    s.includes('decodeur') ||
    s.includes('circuit intégré') ||
    s.includes('circuit integre')
  ) {
    return 'Circuits Intégrés & Logique';
  }

  // 5. Modules & Alimentation
  if (
    s.includes('module de charge') ||
    s.includes('convertisseur') ||
    s.includes('dc-dc') ||
    s.includes('régulateur') ||
    s.includes('regulateur') ||
    s.includes('ldo') ||
    s.includes('buck') ||
    s.includes('boost') ||
    s.includes('7805') ||
    s.includes('1117') ||
    s.includes('2576') ||
    s.includes('2596') ||
    s.includes('alimentation')
  ) {
    return 'Modules & Alimentation';
  }

  // 6. Passifs
  if (
    s.includes('résistance') ||
    s.includes('resistance') ||
    s.includes('condensateur') ||
    s.includes('potentiomètre') ||
    s.includes('potentiometre') ||
    s.includes('trimpot') ||
    s.includes('quartz') ||
    s.includes('résonateur') ||
    s.includes('resonateur') ||
    s.includes('filtre céramique') ||
    s.includes('filtre ceramique') ||
    s.includes('filtre passe-bande') ||
    s.includes('thermistance') ||
    s.includes('varistance') ||
    s.includes('fusible') ||
    s.includes('inductance') ||
    s.includes('transformateur') ||
    s.includes('bobine') ||
    s.includes('allecin') ||
    s.includes('cbb')
  ) {
    return 'Passifs (Résistances, Condensateurs)';
  }

  return 'Divers';
}

export const DEFAULT_COMPONENTS_SEEDS: Omit<ElectronicComponent, 'id' | 'updatedAt'>[] = [
  {
    ref: '74HC595 / 74AHC595',
    family: '74xx Logic',
    type: 'Registre à décalage (SIPO)',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Multiplicateur de sorties numériques',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '16',
    description: 'Registre à décalage à entrée série et sorties parallèles 3-états.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '74HC597',
    family: '74xx Logic',
    type: 'Registre à décalage (PISO)',
    category: 'Circuits Intégrés & Logique',
    functionDesc: "Multiplicateur d'entrées numériques",
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '16',
    description: 'Registre à décalage à entrées parallèles et sortie série.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'LC541A / NV9341 (74AHC541 / 74LV541)',
    family: '74xx Logic',
    type: 'Buffer / Pilote de ligne octal',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Coordination bus, isolation, signal non-inverseur',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '20',
    description: 'Buffer octal 3-états pour adaptation d\'impédance et pilotage de bus.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'HA540 (74AHC540)',
    family: '74xx Logic',
    type: 'Buffer / Pilote de ligne octal inverseur',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Coordination bus, isolation, signal inverseur',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '20',
    description: 'Pilote de bus octal avec sorties 3-états inverseuses.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'HJ237 (74HC237)',
    family: '74xx Logic',
    type: 'Décodeur / Démultiplexeur 3 vers 8',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Sélection d\'adresse avec verrous intégrés',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '16',
    description: 'Décodeur binaire 3 vers 8 lignes avec verrous d\'adresse.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'HC14 (74HC14)',
    family: '74xx Logic',
    type: 'Inverseur Hexa Schmitt Trigger',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Mise au propre de signaux, antirebonds',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '14',
    description: '6 inverseurs indépendants à trigger de Schmitt pour mise en forme de signaux.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'LM358',
    family: 'Amplificateurs Opérationnels',
    type: 'AOP Double à alimentation simple',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Amplification, comparaison, filtrage analogique',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '8',
    description: 'Amplificateur opérationnel double polyvalent basse consommation.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'ICL7612 BCPA',
    family: 'Amplificateurs Opérationnels',
    type: 'AOP CMOS ultra-faible consommation',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Conditionnement de signal haute impédance',
    footprint: 'Traversant / CMS (DIP-8 / SOIC-8)',
    package: normalizePackageFormat('Traversant / CMS (DIP-8 / SOIC-8)'),
    pins: '8',
    description: 'AOP CMOS à courant de polarisation en pICO-ampères et tension de fonctionnement étendue.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '24C01 / 24C02',
    family: 'EEPROM I2C',
    type: 'Mémoire EEPROM Série I2C 1K/2K',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Stockage non-volatil de données / paramètres',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '8',
    description: 'Sauvegarde de configurations système et identifiants.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '24C64BN (ATMEL168)',
    family: 'EEPROM I2C',
    type: 'EEPROM I2C 64 Kbit (8 Ko)',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Stockage non-volatil de données',
    footprint: 'CMS (SOIC-8)',
    package: normalizePackageFormat('CMS (SOIC-8)'),
    pins: '8',
    description: 'Mémoire EEPROM série I2C 64 Kbits basse tension.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '30518 7AT C4V1',
    family: 'PMIC / Gestion d\'énergie',
    type: 'Circuit Intégré de Gestion de Puissance (TI)',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Gestion d\'alimentation et régulation système',
    footprint: 'CMS',
    package: normalizePackageFormat('CMS'),
    pins: '8',
    description: 'CI spécialisé de gestion de puissance par Texas Instruments.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'AP2301 (NHSCE AP2301)',
    family: 'Power Switch IC',
    type: 'Commutateur de distribution USB protégé',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Protection contre surintensités et contrôle de port USB',
    footprint: 'CMS (SOIC-8 / MSOP-8)',
    package: normalizePackageFormat('CMS (SOIC-8 / MSOP-8)'),
    pins: '8',
    description: 'Interrupteur de puissance USB intégré avec limitation de courant.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'SP2701 C2D2603',
    family: 'Power Management IC',
    type: 'Régulateur / Contrôleur de puissance CMS',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Commande et régulation de puissance',
    footprint: 'CMS (SOP-8)',
    package: normalizePackageFormat('CMS (SOP-8)'),
    pins: '8',
    description: 'Circuit intégré spécialisé en boîtier CMS 8 broches.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'PC817 / EL817',
    family: 'Optocoupleurs',
    type: 'Optocoupleur à phototransistor',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Isolation galvanique entre circuits haute/basse tension',
    footprint: 'Traversant (DIP-4) / CMS (SMD-4)',
    package: normalizePackageFormat('Traversant (DIP-4) / CMS (SMD-4)'),
    pins: '4',
    description: 'Séparation des masses et transmission de signal optique.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'NE555',
    family: 'Timers / Temporisateurs',
    type: 'Timer / Générateur d\'impulsions',
    category: 'Circuits Intégrés & Logique',
    functionDesc: 'Génération de signaux carrés, PWM et temporisations',
    footprint: 'Traversant (DIP-8)',
    package: normalizePackageFormat('Traversant (DIP-8)'),
    pins: '8',
    description: 'Horloge et temporisateur universel astable/monostable.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Module LED + Lentille (130430NE)',
    family: 'Optoélectronique',
    type: 'LED 5mm avec optique de focalisation',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Émission lumineuse focalisée / Témoin optique',
    footprint: 'PCB miniature avec câbles',
    package: normalizePackageFormat('PCB miniature avec câbles'),
    pins: '2',
    description: 'Diode électroluminescente sur PCB avec lentille plastique de focalisation.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'TL431',
    family: 'Références de Tension',
    type: 'Régulateur de tension ajustable de précision (Shunt)',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Tension de référence très stable (2.5V à 36V)',
    footprint: 'Traversant (TO-92 / DIP-3)',
    package: normalizePackageFormat('Traversant (TO-92 / DIP-3)'),
    pins: '3',
    description: 'Référence de tension programmable Shunt pour boucle d\'asservissement.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'L7805 / LM7805',
    family: '78xx Regulators',
    type: 'Régulateur linéaire positif 5V 1.5A',
    category: 'Modules & Alimentation',
    functionDesc: 'Régulation de tension continue 5V',
    footprint: 'Traversant (TO-220)',
    package: normalizePackageFormat('Traversant (TO-220)'),
    pins: '3',
    description: 'Conversion linéaire stable vers 5V avec protections thermiques.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'AMS1117-3.3',
    family: 'LDO Regulators',
    type: 'Régulateur LDO 3.3V 1A',
    category: 'Modules & Alimentation',
    functionDesc: 'Alimentation 3.3V pour microcontrôleurs',
    footprint: 'CMS (SOT-223)',
    package: normalizePackageFormat('CMS (SOT-223)'),
    pins: '3',
    description: 'Régulateur à faible chute de tension pour circuits 3.3V.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'LM2576-3.3 / LM2596-3.3',
    family: 'Régulateurs Buck',
    type: 'Régulateur à découpage Step-down 3.3V 3A',
    category: 'Modules & Alimentation',
    functionDesc: 'Régulation Buck à haut rendement 3.3V',
    footprint: 'TO-263 / TO-220-5',
    package: normalizePackageFormat('TO-263 / TO-220-5'),
    pins: '5',
    description: 'Convertisseur abaisseur de tension à découpage.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Module de charge de batterie',
    family: 'Modules Alimentation',
    type: 'Chargeur Li-ion / Power-bank (Micro-USB)',
    category: 'Modules & Alimentation',
    functionDesc: 'Gestion de charge batterie et sortie USB',
    footprint: 'Module PCB',
    package: normalizePackageFormat('Module PCB'),
    pins: 'Variable',
    description: 'Module compact de gestion de charge de batterie lithium.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Modules Convertisseurs DC-DC Buck/Boost',
    family: 'Modules Alimentation',
    type: 'Convertisseurs DC-DC ajustables avec trimpots',
    category: 'Modules & Alimentation',
    functionDesc: 'Régulation et ajustement de tension DC',
    footprint: 'Module PCB',
    package: normalizePackageFormat('Module PCB'),
    pins: '4',
    description: 'Cartes de conversion de tension DC-DC équipées de trimpots de précision.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '1N4007',
    family: 'Diodes Redresseuses',
    type: 'Diode de redressement 1A 1000V',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Redressement et protection roue libre',
    footprint: 'Traversant (DO-41)',
    package: normalizePackageFormat('Traversant (DO-41)'),
    pins: '2',
    description: 'Diode standard pour redressement secteur et roue libre.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '1N4148',
    family: 'Diodes Signal',
    type: 'Diode de signal rapide',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Commutation rapide de signaux',
    footprint: 'Traversant (DO-35 verre)',
    package: normalizePackageFormat('Traversant (DO-35 verre)'),
    pins: '2',
    description: 'Diode de signal sous boîtier verre DO-35.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '1N5408',
    family: 'Diodes Redresseuses',
    type: 'Diode de redressement de puissance 3A 1000V',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Redressement fort courant',
    footprint: 'Traversant (DO-201)',
    package: normalizePackageFormat('Traversant (DO-201)'),
    pins: '2',
    description: 'Diode axiale haute puissance 3A.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'GBP310',
    family: 'Ponts Redresseurs',
    type: 'Pont de diodes 3A 1000V',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Redressement double alternance AC -> DC',
    footprint: 'Traversant (GBP)',
    package: normalizePackageFormat('Traversant (GBP)'),
    pins: '4',
    description: 'Pont redresseur monolithique pour secteur.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'ABS10',
    family: 'Ponts Redresseurs CMS',
    type: 'Pont de diodes CMS 1A 1000V',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Redressement AC -> DC compact',
    footprint: 'CMS (ABS)',
    package: normalizePackageFormat('CMS (ABS)'),
    pins: '4',
    description: 'Pont redresseur miniature pour alim compacte.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'SS36',
    family: 'Diodes Schottky CMS',
    type: 'Diode Schottky 3A 60V',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Commutation rapide / faible chute de tension',
    footprint: 'CMS (SMC / SMB)',
    package: normalizePackageFormat('CMS (SMC / SMB)'),
    pins: '2',
    description: 'Diode Schottky pour convertisseurs DC-DC.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: '2N2222 / PN2222 / BC547',
    family: 'Transistors BJT',
    type: 'Transistor NPN à usage général',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Amplification et commutation de puissance',
    footprint: 'Traversant (TO-92)',
    package: normalizePackageFormat('Traversant (TO-92)'),
    pins: '3',
    description: 'Commutation de petites charges jusqu\'à 800mA.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'IRFZ44N / ITA07N65R',
    family: 'MOSFET N',
    type: 'Transistor MOSFET Canal-N de puissance',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Commutation rapide et forte puissance / PWM',
    footprint: 'TO-220 / TO-220F',
    package: normalizePackageFormat('TO-220 / TO-220F'),
    pins: '3',
    description: 'MOSFETs canal N pour découpage de puissance (55V/49A et 650V/7A).',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'SiF70N06',
    family: 'MOSFET N CMS',
    type: 'MOSFET Canal-N 60V 70A',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Commutation forte puissance DC',
    footprint: 'CMS (DPAK / TO-252)',
    package: normalizePackageFormat('CMS (DPAK / TO-252)'),
    pins: '3',
    description: 'Transistor MOSFET CMS ultra-faible Rds(on).',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'TPC8028',
    family: 'MOSFET N CMS',
    type: 'MOSFET Canal-N Toshiba 30V 18A',
    category: 'Semi-conducteurs (Diodes, Transistors, MOSFETs)',
    functionDesc: 'Gestion de puissance / convertisseur Buck synchrone',
    footprint: 'CMS (SOP-8)',
    package: normalizePackageFormat('CMS (SOP-8)'),
    pins: '8',
    description: 'MOSFET CMS 8 broches pour conversion d\'énergie.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Quartz 16.000 MHz (HC-49S / Cylindrique)',
    family: 'Horloge & Quartz',
    type: 'Résonateur à Quartz',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Cadencement et horloge de précision pour microcontrôleur',
    footprint: 'Traversant (HC-49S / Cylindrique)',
    package: normalizePackageFormat('Traversant (HC-49S / Cylindrique)'),
    pins: '2',
    description: 'Resonateur à quartz métallique pour oscillateur système.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'CRB 455E',
    family: 'Résonateurs Céramiques',
    type: 'Résonateur céramique 455 kHz',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Fréquence intermédiaire (FI) pour étages AM',
    footprint: 'Traversant (Orange)',
    package: normalizePackageFormat('Traversant (Orange)'),
    pins: '2',
    description: 'Résonateur céramique miniature boîtier orange.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'HLB 4682 CmY',
    family: 'Filtres Céramiques',
    type: 'Filtre passe-bande céramique 3 broches',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Filtrage de fréquence intermédiaire RF/Audio',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '3',
    description: 'Filtre céramique 3 pattes pour récepteurs radio.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'MF72 2.5D11',
    family: 'Thermistances NTC',
    type: 'Limiteur de courant d\'appel (Inrush Current)',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Protection contre les surintensités à l\'allumage',
    footprint: 'Traversant (Disque 11mm)',
    package: normalizePackageFormat('Traversant (Disque 11mm)'),
    pins: '2',
    description: 'Thermistance NTC 2.5 Ω diamètre 11 mm.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Résistances axiales (Code Couleur)',
    family: 'Résistances',
    type: 'Résistances à couche carbone / métal',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Limitation de courant et diviseurs de tension',
    footprint: 'Traversant (Axial)',
    package: normalizePackageFormat('Traversant (Axial)'),
    pins: '2',
    description: 'Lot de résistances axiales à code couleur.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Résistances de puissance céramiques',
    family: 'Résistances',
    type: 'Résistances axiales de puissance (2W/3W)',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Dissipation thermique et limitation fort courant',
    footprint: 'Traversant Axial',
    package: normalizePackageFormat('Traversant Axial'),
    pins: '2',
    description: 'Résistances renforcées corps céramique ignifugé.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Condensateur Film Polyester Green Cap (.2A223J)',
    family: 'Condensateurs Film',
    type: 'Condensateur film 22nF 100V',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Découplage et filtrage de précision',
    footprint: 'Traversant (Goutte verte)',
    package: normalizePackageFormat('Traversant (Goutte verte)'),
    pins: '2',
    description: 'Condensateur film polyester vert marqué .2A223J.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Condensateur Céramique Disque 103 1kV',
    family: 'Condensateurs Céramiques',
    type: 'Condensateur céramique haute tension (10nF 1000V)',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Filtrage et découplage haute tension',
    footprint: 'Traversant (Disque)',
    package: normalizePackageFormat('Traversant (Disque)'),
    pins: '2',
    description: 'Condensateur disque orange isolé 1000V.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'SAMXON / HANGCOM / PET Electrolytic',
    family: 'Condensateurs Électrolytiques',
    type: 'Condensateurs aluminium polarisés (680µF, 220µF, etc.)',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Filtrage et lissage de tension continue',
    footprint: 'Traversant (Radial)',
    package: normalizePackageFormat('Traversant (Radial)'),
    pins: '2',
    description: 'Condensateurs aluminium radiaux 105°C.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Varistances MOV (14D561K)',
    family: 'Protection / Varistances',
    type: 'Varistance à oxyde métallique 560V',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Protection contre les surtensions et pics secteur',
    footprint: 'Traversant (Disque bleu)',
    package: normalizePackageFormat('Traversant (Disque bleu)'),
    pins: '2',
    description: 'Varistance disque bleu 14mm absorbeuse de surtension.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Fusibles temporisés T3.15AL250V',
    family: 'Protection / Fusibles',
    type: 'Fusible rectangulaire traversant 3.15A 250V',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Protection contre les surintensités de court-circuit',
    footprint: 'Traversant (Rectangulaire)',
    package: normalizePackageFormat('Traversant (Rectangulaire)'),
    pins: '2',
    description: 'Fusible carré rouge de sécurité secteur.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'COILTRONICS VP5-0155TR',
    family: 'Transformateurs CMS',
    type: 'Transformateur Versa-Pac haute fréquence',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Conversion d\'énergie SMPS, Flyback/Sepic',
    footprint: 'CMS (Versa-Pac)',
    package: normalizePackageFormat('CMS (Versa-Pac)'),
    pins: '12',
    description: 'Composant magnétique planaire/CMS 12 broches.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Inductance torique ferrite',
    family: 'Bobines d\'arrêt',
    type: 'Inductance sur tore de ferrite',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Filtrage EMI et antiparasitage',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '2',
    description: 'Bobine à fil émaillé sur anneau de ferrite vert.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'TEC1-12705',
    family: 'Modules Peltier',
    type: 'Élément Peltier thermoélectrique 12V 5A',
    category: 'Capteurs & Actuateurs',
    functionDesc: 'Refroidissement / Chauffage thermoélectrique',
    footprint: 'Module céramique',
    package: normalizePackageFormat('Module céramique'),
    pins: '2 fils',
    description: 'Plaque céramique 40x40mm à état solide.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Relais Sun Hold RAS-1215',
    family: 'Relais Électromécaniques',
    type: 'Relais 12VDC / 15A 125VAC / 10A 240VAC',
    category: 'Capteurs & Actuateurs',
    functionDesc: 'Commutation électmonécanique de puissance',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '5',
    description: 'Relais monostable étanche en boîtier orange.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Condensateurs de sécurité X2 (0.22µF 275VAC)',
    family: 'Condensateurs Sécurité',
    type: 'Condensateurs film X2 auto-cicatrisants',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Filtrage antiparasite secteur EMI',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '2',
    description: 'Condensateurs jaunes d\'isolation de sécurité X2 275V.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Solénoïde DC',
    family: 'Actuateurs Électromagnétiques',
    type: 'Mini électro-aimant linéaire',
    category: 'Capteurs & Actuateurs',
    functionDesc: 'Actionnement mécanique sous tension continu',
    footprint: 'Boîtier métallique à fils',
    package: normalizePackageFormat('Boîtier métallique à fils'),
    pins: '2 fils',
    description: 'Solénoïde miniature avec armature métallique et piston.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Potentiomètre rotatif CP-CY3805 / 130430NE',
    family: 'Potentiomètres',
    type: 'Potentiomètre rotatif sur PCB',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Réglage analogique de résistance',
    footprint: 'PCB dédié',
    package: normalizePackageFormat('PCB dédié'),
    pins: '3',
    description: 'Trimpot rotatif monté sur petit PCB avec connecteur 2 broches.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Potentiomètre ajustable Trimpot 3296 / Bleu',
    family: 'Potentiomètres',
    type: 'Potentiomètre ajustable cermet multitours / mono',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Réglage de précision / étalonnage',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '3',
    description: 'Potentiomètre de réglage carré bleu.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Switchs tactiles CMS / Boutons poussoirs',
    family: 'Interrupteurs CMS',
    type: 'Boutons poussoirs tactiles miniatures',
    category: 'Divers',
    functionDesc: 'Interface utilisateur / contact sec',
    footprint: 'CMS (SMD)',
    package: normalizePackageFormat('CMS (SMD)'),
    pins: '4',
    description: 'Micro-switchs tactiles CMS pour montage en surface.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Capteurs à effet Hall 3144',
    family: 'Capteurs Magnétiques',
    type: 'Capteur à effet Hall numérique A3144',
    category: 'Capteurs & Actuateurs',
    functionDesc: 'Détection magnétométrie / tachymétrie',
    footprint: 'Traversant (TO-92S)',
    package: normalizePackageFormat('Traversant (TO-92S)'),
    pins: '3',
    description: 'Capteur magnétique pour comptage de tours et position.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Ensemble Moteur DC & Fader motorisé',
    family: 'Actuateurs / Potentiomètres Motorisés',
    type: 'Ensemble mécanique Moteur + Glissière',
    category: 'Capteurs & Actuateurs',
    functionDesc: 'Contrôle motorisé de réglette linéaire',
    footprint: 'Châssis avec PCB',
    package: normalizePackageFormat('Châssis avec PCB'),
    pins: 'Connecteur PCB',
    description: 'Assemblage d\'un petit moteur DC couplé à une glissière sur PCB.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Platine entraînement Direct Drive PCB 20810150',
    family: 'Système de Motorisation',
    type: 'Carte de contrôle circulaire avec dissipateurs et moteur',
    category: 'Capteurs & Actuateurs',
    functionDesc: 'Entraînement rotatif haute précision',
    footprint: 'PCB circulaire',
    package: normalizePackageFormat('PCB circulaire'),
    pins: 'Connecteur multi-fils',
    description: 'Plateau tournant avec 4 radiateurs noirs et puces de puissance.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Connecteurs Audio (XLR, Jack 3.5/6.35mm, RCA)',
    family: 'Connectique Audio',
    type: 'Embases et fiches audio mâles/femelles',
    category: 'Connectique',
    functionDesc: 'Acheminement de signaux audio analogiques / symétriques',
    footprint: 'Châssis / Câble',
    package: normalizePackageFormat('Châssis / Câble'),
    pins: '2 à 3',
    description: 'Assortiment complet de fiches et jacks audio.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Connecteurs BNC & Coaxiaux',
    family: 'Connectique RF / Mesure',
    type: 'Embases BNC femelles châssis',
    category: 'Connectique',
    functionDesc: 'Raccordement d\'appareils de mesure / vidéo RF',
    footprint: 'Châssis',
    package: normalizePackageFormat('Châssis'),
    pins: '2',
    description: 'Connecteurs BNC à verrouillage baïonnette 50/75Ω.',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Kit Résistances Allecin 1/4W 5% (250 PCS)',
    family: 'Kits / Coffrets',
    type: 'Assortiment de 250 résistances 1/4W 5%',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Réserve de composants de prototypage',
    footprint: 'Mallette compartimentée',
    package: normalizePackageFormat('Mallette compartimentée'),
    pins: '2',
    description: 'Coffret plastique étiqueté contenant 250 résistances (1Ω à 1MΩ).',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  },
  {
    ref: 'Kit Condensateurs CBB 100V (100 PCS)',
    family: 'Kits / Coffrets',
    type: 'Assortiment de 100 condensateurs CBB (10 valeurs)',
    category: 'Passifs (Résistances, Condensateurs)',
    functionDesc: 'Réserve de condensateurs film pour filtrage',
    footprint: 'Mallette compartimentée',
    package: normalizePackageFormat('Mallette compartimentée'),
    pins: '2',
    description: 'Boîtier compartimenté C19 contenant 100 condensateurs (0.01µF à 0.47µF).',
    quantity: 1,
    minQuantity: 0,
    location: 'Atelier'
  }
];
