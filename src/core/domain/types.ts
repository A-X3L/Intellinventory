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

export const CATEGORIES_LIST = [
  'Registre à décalage (SIPO)',
  'Registre à décalage (PISO)',
  'Buffer / Pilote de ligne octal',
  'Buffer / Pilote de ligne octal inverseur',
  'Décodeur / Démultiplexeur 3 vers 8',
  'Inverseur Hexa Schmitt Trigger',
  'AOP Double à alimentation simple',
  'AOP CMOS ultra-faible consommation',
  'Mémoire EEPROM Série I2C 1K/2K',
  'EEPROM I2C 64 Kbit (8 Ko)',
  'Circuit Intégré de Gestion de Puissance (TI)',
  'Commutateur de distribution USB protégé',
  'Régulateur / Contrôleur de puissance CMS',
  'Optocoupleur à phototransistor',
  'Timer / Générateur d\'impulsions',
  'LED 5mm avec optique de focalisation',
  'Régulateur de tension ajustable de précision (Shunt)',
  'Régulateur linéaire positif 5V 1.5A',
  'Régulateur LDO 3.3V 1A',
  'Régulateur à découpage Step-down 3.3V 3A',
  'Chargeur Li-ion / Power-bank (Micro-USB)',
  'Convertisseurs DC-DC ajustables avec trimpots',
  'Diode de redressement 1A 1000V',
  'Diode de signal rapide',
  'Diode de redressement de puissance 3A 1000V',
  'Pont de diodes 3A 1000V',
  'Pont de diodes CMS 1A 1000V',
  'Diode Schottky 3A 60V',
  'Transistor NPN à usage général',
  'Transistor MOSFET Canal-N de puissance',
  'MOSFET Canal-N 60V 70A',
  'MOSFET Canal-N Toshiba 30V 18A',
  'Résonateur à Quartz',
  'Résonateur céramique 455 kHz',
  'Filtre passe-bande céramique 3 broches',
  'Limiteur de courant d\'appel (Inrush Current)',
  'Résistances à couche carbone / métal',
  'Résistances axiales de puissance (2W/3W)',
  'Condensateur film 22nF 100V',
  'Condensateur céramique haute tension (10nF 1000V)',
  'Condensateurs aluminium polarisés (680µF, 220µF, etc.)',
  'Varistance à oxyde métallique 560V',
  'Fusible rectangulaire traversant 3.15A 250V',
  'Transformateur Versa-Pac haute fréquence',
  'Inductance sur tore de ferrite',
  'Élément Peltier thermoélectrique 12V 5A',
  'Relais 12VDC / 15A 125VAC / 10A 240VAC',
  'Condensateurs film X2 auto-cicatrisants',
  'Mini électro-aimant linéaire',
  'Potentiomètre rotatif sur PCB',
  'Potentiomètre ajustable cermet multitours / mono',
  'Boutons poussoirs tactiles miniatures',
  'Capteur à effet Hall numérique A3144',
  'Ensemble mécanique Moteur + Glissière',
  'Carte de contrôle circulaire avec dissipateurs et moteur',
  'Embases et fiches audio mâles/femelles',
  'Embases BNC femelles châssis',
  'Assortiment de 250 résistances 1/4W 5%',
  'Assortiment de 100 condensateurs CBB (10 valeurs)'
] as const;

export const DEFAULT_COMPONENTS_SEEDS: Omit<ElectronicComponent, 'id' | 'updatedAt'>[] = [
  {
    ref: '74HC595 / 74AHC595',
    family: '74xx Logic',
    type: 'Registre à décalage (SIPO)',
    category: 'Registre à décalage (SIPO)',
    functionDesc: 'Multiplicateur de sorties numériques',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '16',
    description: 'Registre à décalage à entrée série et sorties parallèles 3-états.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '74HC597',
    family: '74xx Logic',
    type: 'Registre à décalage (PISO)',
    category: 'Registre à décalage (PISO)',
    functionDesc: "Multiplicateur d'entrées numériques",
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '16',
    description: 'Registre à décalage à entrées parallèles et sortie série.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'LC541A / NV9341 (74AHC541 / 74LV541)',
    family: '74xx Logic',
    type: 'Buffer / Pilote de ligne octal',
    category: 'Buffer / Pilote de ligne octal',
    functionDesc: 'Coordination bus, isolation, signal non-inverseur',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '20',
    description: 'Buffer octal 3-états pour adaptation d\'impédance et pilotage de bus.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'HA540 (74AHC540)',
    family: '74xx Logic',
    type: 'Buffer / Pilote de ligne octal inverseur',
    category: 'Buffer / Pilote de ligne octal inverseur',
    functionDesc: 'Coordination bus, isolation, signal inverseur',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '20',
    description: 'Pilote de bus octal avec sorties 3-états inverseuses.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'HJ237 (74HC237)',
    family: '74xx Logic',
    type: 'Décodeur / Démultiplexeur 3 vers 8',
    category: 'Décodeur / Démultiplexeur 3 vers 8',
    functionDesc: 'Sélection d\'adresse avec verrous intégrés',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '16',
    description: 'Décodeur binaire 3 vers 8 lignes avec verrous d\'adresse.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'HC14 (74HC14)',
    family: '74xx Logic',
    type: 'Inverseur Hexa Schmitt Trigger',
    category: 'Inverseur Hexa Schmitt Trigger',
    functionDesc: 'Mise au propre de signaux, antirebonds',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '14',
    description: '6 inverseurs indépendants à trigger de Schmitt pour mise en forme de signaux.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'LM358',
    family: 'Amplificateurs Opérationnels',
    type: 'AOP Double à alimentation simple',
    category: 'AOP Double à alimentation simple',
    functionDesc: 'Amplification, comparaison, filtrage analogique',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '8',
    description: 'Amplificateur opérationnel double polyvalent basse consommation.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'ICL7612 BCPA',
    family: 'Amplificateurs Opérationnels',
    type: 'AOP CMOS ultra-faible consommation',
    category: 'AOP CMOS ultra-faible consommation',
    functionDesc: 'Conditionnement de signal haute impédance',
    footprint: 'Traversant / CMS (DIP-8 / SOIC-8)',
    package: normalizePackageFormat('Traversant / CMS (DIP-8 / SOIC-8)'),
    pins: '8',
    description: 'AOP CMOS à courant de polarisation en pICO-ampères et tension de fonctionnement étendue.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '24C01 / 24C02',
    family: 'EEPROM I2C',
    type: 'Mémoire EEPROM Série I2C 1K/2K',
    category: 'Mémoire EEPROM Série I2C 1K/2K',
    functionDesc: 'Stockage non-volatil de données / paramètres',
    footprint: 'CMS / SMD',
    package: normalizePackageFormat('CMS / SMD'),
    pins: '8',
    description: 'Sauvegarde de configurations système et identifiants.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '24C64BN (ATMEL168)',
    family: 'EEPROM I2C',
    type: 'EEPROM I2C 64 Kbit (8 Ko)',
    category: 'EEPROM I2C 64 Kbit (8 Ko)',
    functionDesc: 'Stockage non-volatil de données',
    footprint: 'CMS (SOIC-8)',
    package: normalizePackageFormat('CMS (SOIC-8)'),
    pins: '8',
    description: 'Mémoire EEPROM série I2C 64 Kbits basse tension.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '30518 7AT C4V1',
    family: 'PMIC / Gestion d\'énergie',
    type: 'Circuit Intégré de Gestion de Puissance (TI)',
    category: 'Circuit Intégré de Gestion de Puissance (TI)',
    functionDesc: 'Gestion d\'alimentation et régulation système',
    footprint: 'CMS',
    package: normalizePackageFormat('CMS'),
    pins: '8',
    description: 'CI spécialisé de gestion de puissance par Texas Instruments.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'AP2301 (NHSCE AP2301)',
    family: 'Power Switch IC',
    type: 'Commutateur de distribution USB protégé',
    category: 'Commutateur de distribution USB protégé',
    functionDesc: 'Protection contre surintensités et contrôle de port USB',
    footprint: 'CMS (SOIC-8 / MSOP-8)',
    package: normalizePackageFormat('CMS (SOIC-8 / MSOP-8)'),
    pins: '8',
    description: 'Interrupteur de puissance USB intégré avec limitation de courant.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'SP2701 C2D2603',
    family: 'Power Management IC',
    type: 'Régulateur / Contrôleur de puissance CMS',
    category: 'Régulateur / Contrôleur de puissance CMS',
    functionDesc: 'Commande et régulation de puissance',
    footprint: 'CMS (SOP-8)',
    package: normalizePackageFormat('CMS (SOP-8)'),
    pins: '8',
    description: 'Circuit intégré spécialisé en boîtier CMS 8 broches.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'PC817 / EL817',
    family: 'Optocoupleurs',
    type: 'Optocoupleur à phototransistor',
    category: 'Optocoupleur à phototransistor',
    functionDesc: 'Isolation galvanique entre circuits haute/basse tension',
    footprint: 'Traversant (DIP-4) / CMS (SMD-4)',
    package: normalizePackageFormat('Traversant (DIP-4) / CMS (SMD-4)'),
    pins: '4',
    description: 'Séparation des masses et transmission de signal optique.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'NE555',
    family: 'Timers / Temporisateurs',
    type: 'Timer / Générateur d\'impulsions',
    category: 'Timer / Générateur d\'impulsions',
    functionDesc: 'Génération de signaux carrés, PWM et temporisations',
    footprint: 'Traversant (DIP-8)',
    package: normalizePackageFormat('Traversant (DIP-8)'),
    pins: '8',
    description: 'Horloge et temporisateur universel astable/monostable.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Module LED + Lentille (130430NE)',
    family: 'Optoélectronique',
    type: 'LED 5mm avec optique de focalisation',
    category: 'LED 5mm avec optique de focalisation',
    functionDesc: 'Émission lumineuse focalisée / Témoin optique',
    footprint: 'PCB miniature avec câbles',
    package: normalizePackageFormat('PCB miniature avec câbles'),
    pins: '2',
    description: 'Diode électroluminescente sur PCB avec lentille plastique de focalisation.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'TL431',
    family: 'Références de Tension',
    type: 'Régulateur de tension ajustable de précision (Shunt)',
    category: 'Régulateur de tension ajustable de précision (Shunt)',
    functionDesc: 'Tension de référence très stable (2.5V à 36V)',
    footprint: 'Traversant (TO-92 / DIP-3)',
    package: normalizePackageFormat('Traversant (TO-92 / DIP-3)'),
    pins: '3',
    description: 'Référence de tension programmable Shunt pour boucle d\'asservissement.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'L7805 / LM7805',
    family: '78xx Regulators',
    type: 'Régulateur linéaire positif 5V 1.5A',
    category: 'Régulateur linéaire positif 5V 1.5A',
    functionDesc: 'Régulation de tension continue 5V',
    footprint: 'Traversant (TO-220)',
    package: normalizePackageFormat('Traversant (TO-220)'),
    pins: '3',
    description: 'Conversion linéaire stable vers 5V avec protections thermiques.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'AMS1117-3.3',
    family: 'LDO Regulators',
    type: 'Régulateur LDO 3.3V 1A',
    category: 'Régulateur LDO 3.3V 1A',
    functionDesc: 'Alimentation 3.3V pour microcontrôleurs',
    footprint: 'CMS (SOT-223)',
    package: normalizePackageFormat('CMS (SOT-223)'),
    pins: '3',
    description: 'Régulateur à faible chute de tension pour circuits 3.3V.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'LM2576-3.3 / LM2596-3.3',
    family: 'Régulateurs Buck',
    type: 'Régulateur à découpage Step-down 3.3V 3A',
    category: 'Régulateur à découpage Step-down 3.3V 3A',
    functionDesc: 'Régulation Buck à haut rendement 3.3V',
    footprint: 'TO-263 / TO-220-5',
    package: normalizePackageFormat('TO-263 / TO-220-5'),
    pins: '5',
    description: 'Convertisseur abaisseur de tension à découpage.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Module de charge de batterie',
    family: 'Modules Alimentation',
    type: 'Chargeur Li-ion / Power-bank (Micro-USB)',
    category: 'Chargeur Li-ion / Power-bank (Micro-USB)',
    functionDesc: 'Gestion de charge batterie et sortie USB',
    footprint: 'Module PCB',
    package: normalizePackageFormat('Module PCB'),
    pins: 'Variable',
    description: 'Module compact de gestion de charge de batterie lithium.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Modules Convertisseurs DC-DC Buck/Boost',
    family: 'Modules Alimentation',
    type: 'Convertisseurs DC-DC ajustables avec trimpots',
    category: 'Convertisseurs DC-DC ajustables avec trimpots',
    functionDesc: 'Régulation et ajustement de tension DC',
    footprint: 'Module PCB',
    package: normalizePackageFormat('Module PCB'),
    pins: '4',
    description: 'Cartes de conversion de tension DC-DC équipées de trimpots de précision.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '1N4007',
    family: 'Diodes Redresseuses',
    type: 'Diode de redressement 1A 1000V',
    category: 'Diode de redressement 1A 1000V',
    functionDesc: 'Redressement et protection roue libre',
    footprint: 'Traversant (DO-41)',
    package: normalizePackageFormat('Traversant (DO-41)'),
    pins: '2',
    description: 'Diode standard pour redressement secteur et roue libre.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '1N4148',
    family: 'Diodes Signal',
    type: 'Diode de signal rapide',
    category: 'Diode de signal rapide',
    functionDesc: 'Commutation rapide de signaux',
    footprint: 'Traversant (DO-35 verre)',
    package: normalizePackageFormat('Traversant (DO-35 verre)'),
    pins: '2',
    description: 'Diode de signal sous boîtier verre DO-35.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '1N5408',
    family: 'Diodes Redresseuses',
    type: 'Diode de redressement de puissance 3A 1000V',
    category: 'Diode de redressement de puissance 3A 1000V',
    functionDesc: 'Redressement fort courant',
    footprint: 'Traversant (DO-201)',
    package: normalizePackageFormat('Traversant (DO-201)'),
    pins: '2',
    description: 'Diode axiale haute puissance 3A.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'GBP310',
    family: 'Ponts Redresseurs',
    type: 'Pont de diodes 3A 1000V',
    category: 'Pont de diodes 3A 1000V',
    functionDesc: 'Redressement double alternance AC -> DC',
    footprint: 'Traversant (GBP)',
    package: normalizePackageFormat('Traversant (GBP)'),
    pins: '4',
    description: 'Pont redresseur monolithique pour secteur.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'ABS10',
    family: 'Ponts Redresseurs CMS',
    type: 'Pont de diodes CMS 1A 1000V',
    category: 'Pont de diodes CMS 1A 1000V',
    functionDesc: 'Redressement AC -> DC compact',
    footprint: 'CMS (ABS)',
    package: normalizePackageFormat('CMS (ABS)'),
    pins: '4',
    description: 'Pont redresseur miniature pour alim compacte.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'SS36',
    family: 'Diodes Schottky CMS',
    type: 'Diode Schottky 3A 60V',
    category: 'Diode Schottky 3A 60V',
    functionDesc: 'Commutation rapide / faible chute de tension',
    footprint: 'CMS (SMC / SMB)',
    package: normalizePackageFormat('CMS (SMC / SMB)'),
    pins: '2',
    description: 'Diode Schottky pour convertisseurs DC-DC.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: '2N2222 / PN2222 / BC547',
    family: 'Transistors BJT',
    type: 'Transistor NPN à usage général',
    category: 'Transistor NPN à usage général',
    functionDesc: 'Amplification et commutation de puissance',
    footprint: 'Traversant (TO-92)',
    package: normalizePackageFormat('Traversant (TO-92)'),
    pins: '3',
    description: 'Commutation de petites charges jusqu\'à 800mA.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'IRFZ44N / ITA07N65R',
    family: 'MOSFET N',
    type: 'Transistor MOSFET Canal-N de puissance',
    category: 'Transistor MOSFET Canal-N de puissance',
    functionDesc: 'Commutation rapide et forte puissance / PWM',
    footprint: 'TO-220 / TO-220F',
    package: normalizePackageFormat('TO-220 / TO-220F'),
    pins: '3',
    description: 'MOSFETs canal N pour découpage de puissance (55V/49A et 650V/7A).',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'SiF70N06',
    family: 'MOSFET N CMS',
    type: 'MOSFET Canal-N 60V 70A',
    category: 'MOSFET Canal-N 60V 70A',
    functionDesc: 'Commutation forte puissance DC',
    footprint: 'CMS (DPAK / TO-252)',
    package: normalizePackageFormat('CMS (DPAK / TO-252)'),
    pins: '3',
    description: 'Transistor MOSFET CMS ultra-faible Rds(on).',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'TPC8028',
    family: 'MOSFET N CMS',
    type: 'MOSFET Canal-N Toshiba 30V 18A',
    category: 'MOSFET Canal-N Toshiba 30V 18A',
    functionDesc: 'Gestion de puissance / convertisseur Buck synchrone',
    footprint: 'CMS (SOP-8)',
    package: normalizePackageFormat('CMS (SOP-8)'),
    pins: '8',
    description: 'MOSFET CMS 8 broches pour conversion d\'énergie.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Quartz 16.000 MHz (HC-49S / Cylindrique)',
    family: 'Horloge & Quartz',
    type: 'Résonateur à Quartz',
    category: 'Résonateur à Quartz',
    functionDesc: 'Cadencement et horloge de précision pour microcontrôleur',
    footprint: 'Traversant (HC-49S / Cylindrique)',
    package: normalizePackageFormat('Traversant (HC-49S / Cylindrique)'),
    pins: '2',
    description: 'Resonateur à quartz métallique pour oscillateur système.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'CRB 455E',
    family: 'Résonateurs Céramiques',
    type: 'Résonateur céramique 455 kHz',
    category: 'Résonateur céramique 455 kHz',
    functionDesc: 'Fréquence intermédiaire (FI) pour étages AM',
    footprint: 'Traversant (Orange)',
    package: normalizePackageFormat('Traversant (Orange)'),
    pins: '2',
    description: 'Résonateur céramique miniature boîtier orange.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'HLB 4682 CmY',
    family: 'Filtres Céramiques',
    type: 'Filtre passe-bande céramique 3 broches',
    category: 'Filtre passe-bande céramique 3 broches',
    functionDesc: 'Filtrage de fréquence intermédiaire RF/Audio',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '3',
    description: 'Filtre céramique 3 pattes pour récepteurs radio.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'MF72 2.5D11',
    family: 'Thermistances NTC',
    type: 'Limiteur de courant d\'appel (Inrush Current)',
    category: 'Limiteur de courant d\'appel (Inrush Current)',
    functionDesc: 'Protection contre les surintensités à l\'allumage',
    footprint: 'Traversant (Disque 11mm)',
    package: normalizePackageFormat('Traversant (Disque 11mm)'),
    pins: '2',
    description: 'Thermistance NTC 2.5 Ω diamètre 11 mm.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Résistances axiales (Code Couleur)',
    family: 'Résistances',
    type: 'Résistances à couche carbone / métal',
    category: 'Résistances à couche carbone / métal',
    functionDesc: 'Limitation de courant et diviseurs de tension',
    footprint: 'Traversant (Axial)',
    package: normalizePackageFormat('Traversant (Axial)'),
    pins: '2',
    description: 'Lot de résistances axiales à code couleur.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Résistances de puissance céramiques',
    family: 'Résistances',
    type: 'Résistances axiales de puissance (2W/3W)',
    category: 'Résistances axiales de puissance (2W/3W)',
    functionDesc: 'Dissipation thermique et limitation fort courant',
    footprint: 'Traversant Axial',
    package: normalizePackageFormat('Traversant Axial'),
    pins: '2',
    description: 'Résistances renforcées corps céramique ignifugé.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Condensateur Film Polyester Green Cap (.2A223J)',
    family: 'Condensateurs Film',
    type: 'Condensateur film 22nF 100V',
    category: 'Condensateur film 22nF 100V',
    functionDesc: 'Découplage et filtrage de précision',
    footprint: 'Traversant (Goutte verte)',
    package: normalizePackageFormat('Traversant (Goutte verte)'),
    pins: '2',
    description: 'Condensateur film polyester vert marqué .2A223J.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Condensateur Céramique Disque 103 1kV',
    family: 'Condensateurs Céramiques',
    type: 'Condensateur céramique haute tension (10nF 1000V)',
    category: 'Condensateur céramique haute tension (10nF 1000V)',
    functionDesc: 'Filtrage et découplage haute tension',
    footprint: 'Traversant (Disque)',
    package: normalizePackageFormat('Traversant (Disque)'),
    pins: '2',
    description: 'Condensateur disque orange isolé 1000V.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'SAMXON / HANGCOM / PET Electrolytic',
    family: 'Condensateurs Électrolytiques',
    type: 'Condensateurs aluminium polarisés (680µF, 220µF, etc.)',
    category: 'Condensateurs aluminium polarisés (680µF, 220µF, etc.)',
    functionDesc: 'Filtrage et lissage de tension continue',
    footprint: 'Traversant (Radial)',
    package: normalizePackageFormat('Traversant (Radial)'),
    pins: '2',
    description: 'Condensateurs aluminium radiaux 105°C.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Varistances MOV (14D561K)',
    family: 'Protection / Varistances',
    type: 'Varistance à oxyde métallique 560V',
    category: 'Varistance à oxyde métallique 560V',
    functionDesc: 'Protection contre les surtensions et pics secteur',
    footprint: 'Traversant (Disque bleu)',
    package: normalizePackageFormat('Traversant (Disque bleu)'),
    pins: '2',
    description: 'Varistance disque bleu 14mm absorbeuse de surtension.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Fusibles temporisés T3.15AL250V',
    family: 'Protection / Fusibles',
    type: 'Fusible rectangulaire traversant 3.15A 250V',
    category: 'Fusible rectangulaire traversant 3.15A 250V',
    functionDesc: 'Protection contre les surintensités de court-circuit',
    footprint: 'Traversant (Rectangulaire)',
    package: normalizePackageFormat('Traversant (Rectangulaire)'),
    pins: '2',
    description: 'Fusible carré rouge de sécurité secteur.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'COILTRONICS VP5-0155TR',
    family: 'Transformateurs CMS',
    type: 'Transformateur Versa-Pac haute fréquence',
    category: 'Transformateur Versa-Pac haute fréquence',
    functionDesc: 'Conversion d\'énergie SMPS, Flyback/Sepic',
    footprint: 'CMS (Versa-Pac)',
    package: normalizePackageFormat('CMS (Versa-Pac)'),
    pins: '12',
    description: 'Composant magnétique planaire/CMS 12 broches.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Inductance torique ferrite',
    family: 'Bobines d\'arrêt',
    type: 'Inductance sur tore de ferrite',
    category: 'Inductance sur tore de ferrite',
    functionDesc: 'Filtrage EMI et antiparasitage',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '2',
    description: 'Bobine à fil émaillé sur anneau de ferrite vert.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'TEC1-12705',
    family: 'Modules Peltier',
    type: 'Élément Peltier thermoélectrique 12V 5A',
    category: 'Élément Peltier thermoélectrique 12V 5A',
    functionDesc: 'Refroidissement / Chauffage thermoélectrique',
    footprint: 'Module céramique',
    package: normalizePackageFormat('Module céramique'),
    pins: '2 fils',
    description: 'Plaque céramique 40x40mm à état solide.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Relais Sun Hold RAS-1215',
    family: 'Relais Électromécaniques',
    type: 'Relais 12VDC / 15A 125VAC / 10A 240VAC',
    category: 'Relais 12VDC / 15A 125VAC / 10A 240VAC',
    functionDesc: 'Commutation électmonécanique de puissance',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '5',
    description: 'Relais monostable étanche en boîtier orange.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Condensateurs de sécurité X2 (0.22µF 275VAC)',
    family: 'Condensateurs Sécurité',
    type: 'Condensateurs film X2 auto-cicatrisants',
    category: 'Condensateurs film X2 auto-cicatrisants',
    functionDesc: 'Filtrage antiparasite secteur EMI',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '2',
    description: 'Condensateurs jaunes d\'isolation de sécurité X2 275V.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Solénoïde DC',
    family: 'Actuateurs Électromagnétiques',
    type: 'Mini électro-aimant linéaire',
    category: 'Mini électro-aimant linéaire',
    functionDesc: 'Actionnement mécanique sous tension continu',
    footprint: 'Boîtier métallique à fils',
    package: normalizePackageFormat('Boîtier métallique à fils'),
    pins: '2 fils',
    description: 'Solénoïde miniature avec armature métallique et piston.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Potentiomètre rotatif CP-CY3805 / 130430NE',
    family: 'Potentiomètres',
    type: 'Potentiomètre rotatif sur PCB',
    category: 'Potentiomètre rotatif sur PCB',
    functionDesc: 'Réglage analogique de résistance',
    footprint: 'PCB dédié',
    package: normalizePackageFormat('PCB dédié'),
    pins: '3',
    description: 'Trimpot rotatif monté sur petit PCB avec connecteur 2 broches.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Potentiomètre ajustable Trimpot 3296 / Bleu',
    family: 'Potentiomètres',
    type: 'Potentiomètre ajustable cermet multitours / mono',
    category: 'Potentiomètre ajustable cermet multitours / mono',
    functionDesc: 'Réglage de précision / étalonnage',
    footprint: 'Traversant',
    package: normalizePackageFormat('Traversant'),
    pins: '3',
    description: 'Potentiomètre de réglage carré bleu.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Switchs tactiles CMS / Boutons poussoirs',
    family: 'Interrupteurs CMS',
    type: 'Boutons poussoirs tactiles miniatures',
    category: 'Boutons poussoirs tactiles miniatures',
    functionDesc: 'Interface utilisateur / contact sec',
    footprint: 'CMS (SMD)',
    package: normalizePackageFormat('CMS (SMD)'),
    pins: '4',
    description: 'Micro-switchs tactiles CMS pour montage en surface.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Capteurs à effet Hall 3144',
    family: 'Capteurs Magnétiques',
    type: 'Capteur à effet Hall numérique A3144',
    category: 'Capteur à effet Hall numérique A3144',
    functionDesc: 'Détection magnétométrie / tachymétrie',
    footprint: 'Traversant (TO-92S)',
    package: normalizePackageFormat('Traversant (TO-92S)'),
    pins: '3',
    description: 'Capteur magnétique pour comptage de tours et position.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Ensemble Moteur DC & Fader motorisé',
    family: 'Actuateurs / Potentiomètres Motorisés',
    type: 'Ensemble mécanique Moteur + Glissière',
    category: 'Ensemble mécanique Moteur + Glissière',
    functionDesc: 'Contrôle motorisé de réglette linéaire',
    footprint: 'Châssis avec PCB',
    package: normalizePackageFormat('Châssis avec PCB'),
    pins: 'Connecteur PCB',
    description: 'Assemblage d\'un petit moteur DC couplé à une glissière sur PCB.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Platine entraînement Direct Drive PCB 20810150',
    family: 'Système de Motorisation',
    type: 'Carte de contrôle circulaire avec dissipateurs et moteur',
    category: 'Carte de contrôle circulaire avec dissipateurs et moteur',
    functionDesc: 'Entraînement rotatif haute précision',
    footprint: 'PCB circulaire',
    package: normalizePackageFormat('PCB circulaire'),
    pins: 'Connecteur multi-fils',
    description: 'Plateau tournant avec 4 radiateurs noirs et puces de puissance.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Connecteurs Audio (XLR, Jack 3.5/6.35mm, RCA)',
    family: 'Connectique Audio',
    type: 'Embases et fiches audio mâles/femelles',
    category: 'Embases et fiches audio mâles/femelles',
    functionDesc: 'Acheminement de signaux audio analogiques / symétriques',
    footprint: 'Châssis / Câble',
    package: normalizePackageFormat('Châssis / Câble'),
    pins: '2 à 3',
    description: 'Assortiment complet de fiches et jacks audio.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Connecteurs BNC & Coaxiaux',
    family: 'Connectique RF / Mesure',
    type: 'Embases BNC femelles châssis',
    category: 'Embases BNC femelles châssis',
    functionDesc: 'Raccordement d\'appareils de mesure / vidéo RF',
    footprint: 'Châssis',
    package: normalizePackageFormat('Châssis'),
    pins: '2',
    description: 'Connecteurs BNC à verrouillage baïonnette 50/75Ω.',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Kit Résistances Allecin 1/4W 5% (250 PCS)',
    family: 'Kits / Coffrets',
    type: 'Assortiment de 250 résistances 1/4W 5%',
    category: 'Assortiment de 250 résistances 1/4W 5%',
    functionDesc: 'Réserve de composants de prototypage',
    footprint: 'Mallette compartimentée',
    package: normalizePackageFormat('Mallette compartimentée'),
    pins: '2',
    description: 'Coffret plastique étiqueté contenant 250 résistances (1Ω à 1MΩ).',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  },
  {
    ref: 'Kit Condensateurs CBB 100V (100 PCS)',
    family: 'Kits / Coffrets',
    type: 'Assortiment de 100 condensateurs CBB (10 valeurs)',
    category: 'Assortiment de 100 condensateurs CBB (10 valeurs)',
    functionDesc: 'Réserve de condensateurs film pour filtrage',
    footprint: 'Mallette compartimentée',
    package: normalizePackageFormat('Mallette compartimentée'),
    pins: '2',
    description: 'Boîtier compartimenté C19 contenant 100 condensateurs (0.01µF à 0.47µF).',
    quantity: 1,
    minQuantity: 1,
    location: 'Atelier'
  }
];
