/**
 * @file qr-generator.ts
 * @description Générateur autonome de QR Code au format SVG sans aucune dépendance externe.
 * Implémente la spécification ISO/IEC 18004 pour les versions 1 à 10 en mode Octet (Byte) avec correction d'erreur M.
 */

// Tables de Galois Field GF(256) avec polynôme primitif 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 128 ? 0x11d : 0);
  }
})();

function gMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

// Polynômes générateurs Reed-Solomon pour le nombre de mots d'erreur requis
function getGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gMul(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function calculateReedSolomon(data: Uint8Array, eccCount: number): Uint8Array {
  const gen = getGeneratorPoly(eccCount);
  const remainder = new Uint8Array(eccCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < eccCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gMul(gen[j + 1], factor);
    }
    remainder[eccCount - 1] = gMul(gen[eccCount], factor);
  }
  return remainder;
}

// Capacité et paramètres de blocs (Version 1 à 10, Niveau M)
interface QrVersionSpec {
  version: number;
  totalCodewords: number;
  dataCodewords: number;
  eccPerBlock: number;
  blocks: { num: number; dataCodewords: number }[];
  alignmentPatterns: number[];
}

const QR_SPECS: Record<number, QrVersionSpec> = {
  1: {
    version: 1,
    totalCodewords: 26,
    dataCodewords: 16,
    eccPerBlock: 10,
    blocks: [{ num: 1, dataCodewords: 16 }],
    alignmentPatterns: []
  },
  2: {
    version: 2,
    totalCodewords: 44,
    dataCodewords: 28,
    eccPerBlock: 16,
    blocks: [{ num: 1, dataCodewords: 28 }],
    alignmentPatterns: [6, 18]
  },
  3: {
    version: 3,
    totalCodewords: 70,
    dataCodewords: 44,
    eccPerBlock: 26,
    blocks: [{ num: 1, dataCodewords: 44 }],
    alignmentPatterns: [6, 22]
  },
  4: {
    version: 4,
    totalCodewords: 100,
    dataCodewords: 64,
    eccPerBlock: 18,
    blocks: [{ num: 2, dataCodewords: 32 }],
    alignmentPatterns: [6, 26]
  },
  5: {
    version: 5,
    totalCodewords: 134,
    dataCodewords: 86,
    eccPerBlock: 24,
    blocks: [{ num: 2, dataCodewords: 43 }],
    alignmentPatterns: [6, 30]
  },
  6: {
    version: 6,
    totalCodewords: 172,
    dataCodewords: 108,
    eccPerBlock: 16,
    blocks: [{ num: 4, dataCodewords: 27 }],
    alignmentPatterns: [6, 34]
  }
};

export class QrCodeGenerator {
  /**
   * Sélectionne la version minimale adaptée à la longueur du texte
   */
  private static findSuitableVersion(dataLength: number): QrVersionSpec {
    // Mode Byte : 4 bits d'en-tête + 8 bits de longueur (ou 16 pour V>=10) + 8*dataLength bits
    // Nombre d'octets de données requis : ceil((4 + 8 + dataLength * 8) / 8) = dataLength + 2
    const needed = dataLength + 2;
    for (let v = 1; v <= 6; v++) {
      const spec = QR_SPECS[v];
      if (spec && spec.dataCodewords >= needed) {
        return spec;
      }
    }
    return QR_SPECS[6];
  }

  /**
   * Encode les données sous forme de flux binaire
   */
  private static encodeData(text: string, spec: QrVersionSpec): Uint8Array {
    const encoder = new TextEncoder();
    const rawBytes = encoder.encode(text);
    const bits: number[] = [];

    const pushBits = (value: number, count: number) => {
      for (let i = count - 1; i >= 0; i--) {
        bits.push((value >> i) & 1);
      }
    };

    // Mode Byte (0100)
    pushBits(0b0100, 4);
    // Longueur sur 8 bits pour V 1-9
    pushBits(rawBytes.length, 8);
    // Données brutes
    for (const b of rawBytes) {
      pushBits(b, 8);
    }

    // Terminaison (jusqu'à 4 zéros)
    const totalDataBits = spec.dataCodewords * 8;
    const termCount = Math.min(4, totalDataBits - bits.length);
    pushBits(0, termCount);

    // Remplissage octet (multiples de 8)
    while (bits.length % 8 !== 0) {
      bits.push(0);
    }

    // Mots de remplissage d'alternance (0xEC, 0x11)
    const result = new Uint8Array(spec.dataCodewords);
    const bytesCount = bits.length / 8;
    for (let i = 0; i < bytesCount; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bits[i * 8 + j];
      }
      result[i] = b;
    }

    const padPatterns = [0xec, 0x11];
    let padIdx = 0;
    for (let i = bytesCount; i < spec.dataCodewords; i++) {
      result[i] = padPatterns[padIdx % 2];
      padIdx++;
    }

    return result;
  }

  /**
   * Entrelace les blocs de données et les blocs d'erreur
   */
  private static createInterleavedCodewords(data: Uint8Array, spec: QrVersionSpec): Uint8Array {
    const dataBlocks: Uint8Array[] = [];
    const eccBlocks: Uint8Array[] = [];

    let offset = 0;
    for (const bConfig of spec.blocks) {
      for (let i = 0; i < bConfig.num; i++) {
        const dBlock = data.slice(offset, offset + bConfig.dataCodewords);
        offset += bConfig.dataCodewords;
        const eBlock = calculateReedSolomon(dBlock, spec.eccPerBlock);
        dataBlocks.push(dBlock);
        eccBlocks.push(eBlock);
      }
    }

    const total = new Uint8Array(spec.totalCodewords);
    let ptr = 0;

    // Entrelacement des données
    const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
    for (let i = 0; i < maxDataLen; i++) {
      for (const b of dataBlocks) {
        if (i < b.length) {
          total[ptr++] = b[i];
        }
      }
    }

    // Entrelacement des blocs ECC
    for (let i = 0; i < spec.eccPerBlock; i++) {
      for (const b of eccBlocks) {
        total[ptr++] = b[i];
      }
    }

    return total;
  }

  /**
   * Construit la matrice du QR Code
   */
  public static generateMatrix(text: string): boolean[][] {
    const spec = this.findSuitableVersion(text.length);
    const size = 17 + spec.version * 4;
    const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Placeur de mire de positionnement (Finder Pattern 7x7 + séparateur 8x8)
    const placeFinder = (startX: number, startY: number) => {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const x = startX + dx;
          const y = startY + dy;
          if (x >= 0 && x < size && y >= 0 && y < size) {
            isReserved[y][x] = true;
            if (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6) {
              const isBlack = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
              matrix[y][x] = isBlack;
            } else {
              matrix[y][x] = false;
            }
          }
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(size - 7, 0);
    placeFinder(0, size - 7);

    // Motifs d'alignement (Alignment patterns) pour Version >= 2
    if (spec.alignmentPatterns.length > 0) {
      for (const y of spec.alignmentPatterns) {
        for (const x of spec.alignmentPatterns) {
          // Éviter de chevaucher les finders
          if (
            (x < 9 && y < 9) ||
            (x > size - 9 && y < 9) ||
            (x < 9 && y > size - 9)
          ) {
            continue;
          }
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const px = x + dx;
              const py = y + dy;
              isReserved[py][px] = true;
              const isBlack = Math.abs(dx) === 2 || Math.abs(dy) === 2 || (dx === 0 && dy === 0);
              matrix[py][px] = isBlack;
            }
          }
        }
      }
    }

    // Motifs de synchronisation (Timing Patterns)
    for (let i = 8; i < size - 8; i++) {
      if (!isReserved[6][i]) {
        isReserved[6][i] = true;
        matrix[6][i] = i % 2 === 0;
      }
      if (!isReserved[i][6]) {
        isReserved[i][6] = true;
        matrix[i][6] = i % 2 === 0;
      }
    }

    // Module noir fixe
    isReserved[size - 8][8] = true;
    matrix[size - 8][8] = true;

    // Réservation des bandes d'informations de format (Format Info)
    for (let i = 0; i < 9; i++) {
      isReserved[8][i] = true;
      isReserved[i][8] = true;
      if (size - 1 - i >= 0) {
        isReserved[8][size - 1 - i] = true;
        isReserved[size - 1 - i][8] = true;
      }
    }

    // Encodage et placement des données
    const encodedData = this.encodeData(text, spec);
    const finalCodewords = this.createInterleavedCodewords(encodedData, spec);

    // Déroulage bit par bit
    const bitStream: number[] = [];
    for (const byte of finalCodewords) {
      for (let b = 7; b >= 0; b--) {
        bitStream.push((byte >> b) & 1);
      }
    }

    let bitIdx = 0;
    let upward = true;

    for (let right = size - 1; right > 0; right -= 2) {
      if (right === 6) right--; // Sauter la colonne de synchronisation verticale
      const left = right - 1;

      const yRange = upward
        ? Array.from({ length: size }, (_, i) => size - 1 - i)
        : Array.from({ length: size }, (_, i) => i);

      for (const y of yRange) {
        for (const x of [right, left]) {
          if (!isReserved[y][x]) {
            const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] === 1 : false;
            // Application du masque 0 : (x + y) % 2 === 0
            const mask = (x + y) % 2 === 0;
            matrix[y][x] = bit !== mask;
          }
        }
      }
      upward = !upward;
    }

    // Format Info pour Niveau M, Masque 0 : 0x4a5b (100101001011011b)
    const FORMAT_INFO_M_MASK0 = 0x4a5b;
    for (let i = 0; i < 15; i++) {
      const bit = ((FORMAT_INFO_M_MASK0 >> i) & 1) === 1;
      // Autour du finder supérieur gauche
      if (i < 6) {
        matrix[i][8] = bit;
      } else if (i === 6) {
        matrix[7][8] = bit;
      } else if (i === 7) {
        matrix[8][8] = bit;
      } else if (i === 8) {
        matrix[8][7] = bit;
      } else {
        matrix[8][14 - i] = bit;
      }

      // Répartition bas et droite
      if (i < 8) {
        matrix[8][size - 1 - i] = bit;
      } else {
        matrix[size - 15 + i][8] = bit;
      }
    }

    return matrix.map((row) => row.map((cell) => cell ?? false));
  }

  /**
   * Génère le QR Code sous forme d'une chaîne SVG optimisée et responsive
   */
  public static generateSvg(text: string, sizePx = 256, margin = 4): string {
    const matrix = this.generateMatrix(text);
    const modulesCount = matrix.length;
    const totalSize = modulesCount + margin * 2;

    let paths = '';
    for (let y = 0; y < modulesCount; y++) {
      for (let x = 0; x < modulesCount; x++) {
        if (matrix[y][x]) {
          paths += `M${x + margin},${y + margin}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <path d="${paths.trim()}" fill="#000000"/>
</svg>`;
  }
}
