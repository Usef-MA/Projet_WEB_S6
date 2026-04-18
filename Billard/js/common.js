/**
 * common.js — Constantes partagées, état global, utilitaires
 * Dev A : physique, moteur, IA
 */

// ─── CONFIG GLOBALE (lu/écrit par Dev B via options.html) ───────────────────
window.gameConfig = {
  difficulty: localStorage.getItem('billardDifficulty') || 'medium',
  playerName: 'Joueur',
  soundEnabled: true
};

// ─── ÉTAT GLOBAL (scores lus par Dev B via scores.html) ─────────────────────
window.gameState = {
  scores: [],             // { date, result: 'win'|'lose', difficulty, duration }
  currentGame: null
};

// ─── TABLE & CANVAS ──────────────────────────────────────────────────────────
const TABLE = {
  WIDTH: 900,
  HEIGHT: 500,
  CUSHION: 40,            // épaisseur du bord intérieur
  FELT_COLOR: '#5c1010',  // bordeaux marocain
  FELT_SHADOW: '#3d0808', // bordeaux profond
  RAIL_COLOR: '#3b1a00',  // bois sombre marocain
  RAIL_DARK:  '#220d00',  // bois très sombre
  POCKET_RADIUS: 22,
  POCKET_COLOR: '#0a0000'
};

// ─── BILLES ──────────────────────────────────────────────────────────────────
const BALL = {
  RADIUS: 13,
  FRICTION: 0.988,        // multiplicateur par frame
  MIN_SPEED: 0.08,        // vitesse en dessous de laquelle on arrête la bille
  MAX_SHOT_POWER: 32,     // pixels/frame max
  RESTITUTION: 0.92       // coefficient d'élasticité lors des collisions
};

// ─── COULEURS DES BILLES (1-15 + blanche) ───────────────────────────────────
const BALL_COLORS = {
  0:  '#f5f5f0',  // blanche (cue)
  1:  '#f5c518',  // jaune
  2:  '#1a3fc4',  // bleu
  3:  '#cc2200',  // rouge
  4:  '#6b0fa8',  // violet
  5:  '#e05c00',  // orange
  6:  '#1a7a2a',  // vert
  7:  '#8b1a1a',  // marron
  8:  '#111111',  // noire
  9:  '#f5c518',  // jaune rayé
  10: '#1a3fc4',  // bleu rayé
  11: '#cc2200',  // rouge rayé
  12: '#6b0fa8',  // violet rayé
  13: '#e05c00',  // orange rayé
  14: '#1a7a2a',  // vert rayé
  15: '#8b1a1a'   // marron rayé
};

// ─── POSITIONS DES TROUS ─────────────────────────────────────────────────────
function getPockets() {
  const { WIDTH, HEIGHT, CUSHION } = TABLE;
  const cx = WIDTH / 2;
  // Exactement sur la frontière du tapis jouable (= PLAY_LEFT/TOP/etc.)
  // Les billes atteignent ces coordonnées avant de rebondir sur le mur
  const inset = CUSHION;
  return [
    { x: inset,         y: inset },          // haut gauche
    { x: cx,            y: inset },          // haut milieu
    { x: WIDTH - inset, y: inset },          // haut droite
    { x: inset,         y: HEIGHT - inset }, // bas gauche
    { x: cx,            y: HEIGHT - inset }, // bas milieu
    { x: WIDTH - inset, y: HEIGHT - inset }  // bas droite
  ];
}

// ─── POSITIONS INITIALES DES BILLES ──────────────────────────────────────────
/**
 * Retourne les positions de départ en triangle pour les billes 1-15
 * et la position de la cue ball.
 */
function getRackPositions() {
  const { WIDTH, HEIGHT, CUSHION } = TABLE;
  const R = BALL.RADIUS;
  const spacing = R * 2 + 0.5;
  // pointe du triangle à 2/3 de la table vers la droite
  const tipX = WIDTH * 0.65;
  const tipY = HEIGHT / 2;

  // Ordre classique 8-ball : la noire au centre (rangée 3, pos 1)
  // Disposition en 5 rangées : 1 / 2 / 3 / 4 / 5
  const order = [
    [1],
    [9, 2],
    [3, 8, 10],
    [4, 14, 11, 5],
    [6, 13, 15, 12, 7]
  ];

  const positions = [];
  order.forEach((row, ri) => {
    row.forEach((ballNum, ci) => {
      const x = tipX + ri * spacing * Math.cos(Math.PI / 6);
      const y = tipY - (row.length - 1) * spacing / 2 + ci * spacing;
      positions.push({ num: ballNum, x, y });
    });
  });

  // cue ball : côté gauche
  positions.push({ num: 0, x: WIDTH * 0.25, y: HEIGHT / 2 });

  return positions;
}

// ─── UTILITAIRES VECTEURS ─────────────────────────────────────────────────────
const Vec2 = {
  add:    (a, b)    => ({ x: a.x + b.x, y: a.y + b.y }),
  sub:    (a, b)    => ({ x: a.x - b.x, y: a.y - b.y }),
  scale:  (v, s)    => ({ x: v.x * s,   y: v.y * s }),
  dot:    (a, b)    => a.x * b.x + a.y * b.y,
  len:    (v)       => Math.sqrt(v.x * v.x + v.y * v.y),
  norm:   (v)       => { const l = Vec2.len(v); return l ? Vec2.scale(v, 1 / l) : { x: 0, y: 0 }; },
  dist:   (a, b)    => Vec2.len(Vec2.sub(a, b)),
  angle:  (v)       => Math.atan2(v.y, v.x),
  fromAngle: (a, l) => ({ x: Math.cos(a) * l, y: Math.sin(a) * l })
};

// ─── UTILITAIRES DIVERS ───────────────────────────────────────────────────────
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randRange(a, b)    { return a + Math.random() * (b - a); }
function degToRad(d)        { return d * Math.PI / 180; }
function radToDeg(r)        { return r * 180 / Math.PI; }

// ─── EXPORTS (accès global) ───────────────────────────────────────────────────
window.BillardCommon = {
  TABLE,
  BALL,
  BALL_COLORS,
  getPockets,
  getRackPositions,
  Vec2,
  clamp,
  randRange,
  degToRad,
  radToDeg
};
