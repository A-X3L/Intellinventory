/**
 * @file types.ts
 * @description Modèle de données du domaine (Couche Core / Hexagone)
 */

export type PackageFormat = 'CMS/SMD' | 'Traversant/DIP' | 'Module' | 'Récupération';
export type AcquisitionSource = 'Neuf' | 'Récupération' | 'Surplus';

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
  cmsCount: number;
  dipCount: number;
  moduleCount: number;
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
  'Logique',
  'Buffer / Pilote',
  'Analogique',
  'Alimentation',
  'Discrets',
  'Optoélectronique',
  'Mémoire',
  'Modules',
  'Microcontrôleurs',
  'Capteurs',
  'Connectique'
] as const;

export const DEFAULT_COMPONENTS_SEEDS: Omit<ElectronicComponent, 'id' | 'updatedAt'>[] = [
  {
    ref: "74HC595 / 74AHC595",
    family: "74xx595",
    type: "Registre à décalage (SIPO)",
    pins: "16",
    footprint: "SOIC-16",
    category: "Logique",
    package: "CMS/SMD",
    functionDesc: "Entrée série / Sorties parallèles",
    description: "Multiplicateur de sorties numériques avec registre tampon (latch).",
    quantity: 12,
    minQuantity: 5,
    location: "Casier B-01",
    datasheetUrl: "https://www.ti.com/lit/ds/symlink/sn74hc595.pdf"
  },
  {
    ref: "74HC597",
    family: "74xx597",
    type: "Registre à décalage (PISO)",
    pins: "16",
    footprint: "SOIC-16",
    category: "Logique",
    package: "CMS/SMD",
    functionDesc: "Entrées parallèles / Sortie série",
    description: "Multiplicateur d'entrées pour scruter plusieurs boutons ou capteurs.",
    quantity: 6,
    minQuantity: 3,
    location: "Casier B-02",
    datasheetUrl: "https://www.ti.com/lit/ds/symlink/sn74hc597.pdf"
  },
  {
    ref: "LC541A / 74AHC541",
    family: "74AHC541",
    type: "Buffer / Pilote de ligne octal",
    pins: "20",
    footprint: "TSSOP-20",
    category: "Buffer / Pilote",
    package: "CMS/SMD",
    functionDesc: "Coordination bus, isolation, signal non-inverseur",
    description: "Pilote de bus 8 bits à sorties 3 états pour isolation entre cartes.",
    quantity: 8,
    minQuantity: 4,
    location: "Casier B-04"
  },
  {
    ref: "HA540 / 74AHC540",
    family: "74AHC540",
    type: "Buffer / Pilote de ligne octal",
    pins: "20",
    footprint: "SOIC-20",
    category: "Buffer / Pilote",
    package: "CMS/SMD",
    functionDesc: "Coordination bus, isolation, signal inverseur",
    description: "Pilote de bus 8 bits inverseur haute vitesse.",
    quantity: 4,
    minQuantity: 2,
    location: "Casier B-05"
  },
  {
    ref: "HJ237 / 74HC237",
    family: "74HC237",
    type: "Décodeur / Démultiplexeur 3 vers 8",
    pins: "16",
    footprint: "SOIC-16",
    category: "Logique",
    package: "CMS/SMD",
    functionDesc: "Sélecteur d'adresse avec verrous intégrés",
    description: "Sélection d'une puce ou d'une ligne parmi 8 depuis un code binaire 3 bits.",
    quantity: 5,
    minQuantity: 2,
    location: "Casier B-06"
  },
  {
    ref: "HC14 / 74HC14",
    family: "74HC14",
    type: "Inverseur Hexa Schmitt Trigger",
    pins: "14",
    footprint: "SOIC-14",
    category: "Logique",
    package: "CMS/SMD",
    functionDesc: "Mise au propre de signaux, anti-rebonds",
    description: "Générateur d'impulsions, oscillateur relaxé RC et remise en forme de signaux bruités.",
    quantity: 15,
    minQuantity: 5,
    location: "Casier B-07",
    datasheetUrl: "https://www.ti.com/lit/ds/symlink/sn74hc14.pdf"
  },
  {
    ref: "LM358",
    family: "LM358",
    type: "Amplificateur Opérationnel Double",
    pins: "8",
    footprint: "SOIC-8",
    category: "Analogique",
    package: "CMS/SMD",
    functionDesc: "Amplification, comparaison, filtrage",
    description: "AOP classique fonctionnant en alimentation simple 3V à 32V.",
    quantity: 18,
    minQuantity: 6,
    location: "Casier A-01",
    datasheetUrl: "https://www.ti.com/lit/ds/symlink/lm358.pdf"
  },
  {
    ref: "24C02",
    family: "Série 24Cx",
    type: "Mémoire EEPROM I2C (2 Kbits)",
    pins: "8",
    footprint: "SOIC-8",
    category: "Mémoire",
    package: "CMS/SMD",
    functionDesc: "Stockage non-volatile de paramètres",
    description: "Sauvegarde d'états d'étalonnage et configuration microcontrôleur.",
    quantity: 7,
    minQuantity: 3,
    location: "Casier M-01"
  },
  {
    ref: "AMS1117-3.3",
    family: "AMS1117",
    type: "Régulateur LDO 3.3V 1A",
    pins: "3",
    footprint: "SOT-223",
    category: "Alimentation",
    package: "CMS/SMD",
    functionDesc: "Régulation faible chute de tension 3.3V",
    description: "Indispensable pour alimenter ESP32, ESP8266 et microcontrôleurs 3.3V à partir d'un bus 5V.",
    quantity: 22,
    minQuantity: 8,
    location: "Casier PWR-01"
  },
  {
    ref: "NE555",
    family: "555 Timer",
    type: "Temporisateur / Timer Universel",
    pins: "8",
    footprint: "DIP-8",
    category: "Analogique",
    package: "Traversant/DIP",
    functionDesc: "Générateur d'impulsions / Horloge / PWM",
    description: "Montage monostable ou astable, clignotant, sirène et MLI.",
    quantity: 14,
    minQuantity: 5,
    location: "Tiroir DIP-01",
    datasheetUrl: "https://www.ti.com/lit/ds/symlink/ne555.pdf"
  },
  {
    ref: "PC817 / EL817",
    family: "PC817",
    type: "Optocoupleur Phototransistor",
    pins: "4",
    footprint: "DIP-4",
    category: "Optoélectronique",
    package: "Traversant/DIP",
    functionDesc: "Isolation galvanique jusqu'à 5000 Vrms",
    description: "Séparation sécurisée de masse entre circuit logique et étage de puissance.",
    quantity: 11,
    minQuantity: 4,
    location: "Tiroir DIP-02"
  },
  {
    ref: "TL431",
    family: "TL431",
    type: "Référence de tension Shunt ajustable",
    pins: "3",
    footprint: "TO-92",
    category: "Alimentation",
    package: "Traversant/DIP",
    functionDesc: "Référence de précision ajustable de 2.5V à 36V",
    description: "Utilisé dans les boucles de rétroaction d'alimentations à découpage et convertisseurs ADC.",
    quantity: 9,
    minQuantity: 3,
    location: "Tiroir DIP-03"
  },
  {
    ref: "L7805CV",
    family: "Série 78xx",
    type: "Régulateur linéaire positif 5V 1.5A",
    pins: "3",
    footprint: "TO-220",
    category: "Alimentation",
    package: "Traversant/DIP",
    functionDesc: "Conversion vers 5V continu stable",
    description: "Alimentation robuste pour banc d'essai et logique TTL.",
    quantity: 8,
    minQuantity: 4,
    location: "Tiroir PWR-02"
  },
  {
    ref: "1N4007",
    family: "1N400x",
    type: "Diode de redressement 1000V 1A",
    pins: "2",
    footprint: "DO-41",
    category: "Discrets",
    package: "Traversant/DIP",
    functionDesc: "Redressement et protection contre inversion",
    description: "Diode de roue libre pour bobines de relais et solénoïdes.",
    quantity: 45,
    minQuantity: 15,
    location: "Bande D-01"
  },
  {
    ref: "1N4148",
    family: "1N4148",
    type: "Diode de commutation rapide (4ns)",
    pins: "2",
    footprint: "DO-35",
    category: "Discrets",
    package: "Traversant/DIP",
    functionDesc: "Commutation haute vitesse et détection de signaux",
    description: "Indispensable pour logiques à diodes et protections de ligne.",
    quantity: 50,
    minQuantity: 20,
    location: "Bande D-02"
  },
  {
    ref: "2N2222A",
    family: "2N2222",
    type: "Transistor bipolaire NPN 40V 800mA",
    pins: "3",
    footprint: "TO-92",
    category: "Discrets",
    package: "Traversant/DIP",
    functionDesc: "Commutation de relais, LED et moteurs basse tension",
    description: "Transistor d'usage général incontournable.",
    quantity: 26,
    minQuantity: 10,
    location: "Tiroir T-01"
  },
  {
    ref: "IRFZ44N",
    family: "MOSFET Canal N",
    type: "Power MOSFET 55V 49A (Rds_on 17.5mΩ)",
    pins: "3",
    footprint: "TO-220AB",
    category: "Discrets",
    package: "Traversant/DIP",
    functionDesc: "Commutation de forte puissance et hacheur PWM",
    description: "Contrôle de moteurs DC, rubans LED 12V/24V et résistances chauffantes.",
    quantity: 6,
    minQuantity: 3,
    location: "Tiroir T-02"
  },
  {
    ref: "Quartz 16.000 MHz",
    family: "Horloge Cristal",
    type: "Résonateur à quartz fondamental (18pF)",
    pins: "2",
    footprint: "HC-49S",
    category: "Discrets",
    package: "Traversant/DIP",
    functionDesc: "Cadencement et horloge pour microcontrôleur",
    description: "Horloge de précision pour ATmega328P / Arduino Uno standalone.",
    quantity: 10,
    minQuantity: 4,
    location: "Casier OSC-01"
  },
  {
    ref: "TP4056 + Protection",
    family: "Power-bank / Li-Ion",
    type: "Module de chargeur Li-Ion 1S 5V -> 4.2V 1A",
    pins: "Module",
    footprint: "Module PCB USB-C",
    category: "Modules",
    package: "Récupération",
    functionDesc: "Charge et protection sous-tension de cellule 18650",
    description: "Intègre le chip TP4056 et circuit de protection DW01A + FS8205A.",
    quantity: 4,
    minQuantity: 2,
    location: "Bac Modules-01"
  },
  {
    ref: "TEC1-12705",
    family: "TEC1-127xx",
    type: "Module thermoélectrique à effet Peltier 12V 5A",
    pins: "2 fils",
    footprint: "Module céramique 40x40mm",
    category: "Modules",
    package: "Récupération",
    functionDesc: "Refroidissement actif ou générateur Seebeck",
    description: "Différence de température jusqu'à 65°C avec dissipateur thermique adapté.",
    quantity: 2,
    minQuantity: 1,
    location: "Bac Puissance-01"
  }
];
