// ============================================================
// SOUK DASH — Configuration centrale du jeu
// ============================================================

// --- Dimensions du canvas (grille 10×10, cellule 60px) ---
export const CELL_SIZE    = 60;
export const COLS         = 10;
export const ROWS         = 10;
export const CANVAS_WIDTH  = CELL_SIZE * COLS;  // 600
export const CANVAS_HEIGHT = CELL_SIZE * ROWS;  // 600

// --- Layout de la grille ---
// Row 0 : arrivée (but)
// Row 1-3 : couloir d'obstacles (section haute)
// Row 4 : zone sûre (milieu)
// Row 5-8 : couloir d'obstacles (section basse)
// Row 9 : départ (joueur)
export const ROW_GOAL  = 0;
export const ROW_SAFE  = [4, 9];
export const ROW_START = 9;

export const PLAYER_START_COL = Math.floor(COLS / 2); // 5
export const PLAYER_START_ROW = ROW_START;             // 9

// --- Gameplay ---
export const MAX_LIVES              = 3;
export const INVINCIBILITY_DURATION = 1.4; // secondes après une collision

// --- Hitbox joueur (inset en pixels par rapport à la cellule) ---
export const PLAYER_HITBOX_INSET = 10;

// --- Score ---
export const SCORE_PER_CROSS      = 200;  // traversée réussie
export const SCORE_TIME_BONUS_MAX = 300;  // bonus temps (décroît jusqu'à 0)
export const SCORE_LIFE_BONUS     = 150;  // bonus par vie restante à la victoire

// --- Palettes de couleurs Marocaines ---
export const COLORS = {
    // Zones
    goal       : '#2E1760',   // indigo profond (arche / porte)
    goalArch   : '#4B2A8A',
    goalGold   : '#D4AF37',
    safe       : '#A0612A',   // terracotta (trottoir)
    safeTile   : '#8A5220',
    laneLight  : '#D4A868',   // sable clair (ruelle)
    laneDark   : '#C09050',   // sable foncé (ruelle alternée)
    start      : '#8A5220',
    // UI
    hudBg      : 'rgba(0,0,0,0.55)',
    hudGold    : '#D4AF37',
    hudWhite   : '#F0EAD6',
    hudRed     : '#E74C3C',
    // Player
    playerBody : '#1A5FA8',   // djellaba bleue
    playerHead : '#F5CBA7',   // visage
    playerAccent: '#D4AF37',  // détail or
    // Page
    pageBg     : '#120700',
};

// ============================================================
// DÉFINITION DES NIVEAUX
// Chaque entrée dans `lanes` décrit un couloir d'obstacles.
// dir:  1 → droite,  -1 → gauche
// type : identifiant visuel
// width : largeur en pixels de l'obstacle
// ============================================================
export const LEVELS = [
    {
        id       : 1,
        name     : 'MÉDINA',
        subtitle : 'Les ruelles des artisans',
        hint     : 'Traversez les ruelles à votre rythme',
        bgLight  : '#D4A868',
        bgDark   : '#C09050',
        timeLimit: 45,
        lanes: [
            { row: 1, dir:  1, speed:  75, count: 2, type: 'charrette', color: '#7A3B1E', width: 80 },
            { row: 2, dir: -1, speed:  60, count: 2, type: 'passant',   color: '#4A6A28', width: 42 },
            { row: 3, dir:  1, speed:  85, count: 2, type: 'velo',      color: '#B8860B', width: 52 },
            { row: 5, dir: -1, speed:  70, count: 2, type: 'charrette', color: '#8B4513', width: 80 },
            { row: 6, dir:  1, speed:  55, count: 2, type: 'passant',   color: '#3A5A1E', width: 42 },
            { row: 7, dir: -1, speed:  80, count: 2, type: 'velo',      color: '#9A720F', width: 52 },
            { row: 8, dir:  1, speed:  65, count: 2, type: 'charrette', color: '#7A3B1E', width: 80 },
        ]
    },
    {
        id       : 2,
        name     : 'SOUK',
        subtitle : 'L\'effervescence du marché',
        hint     : 'Les porteurs ne s\'arrêtent pas !',
        bgLight  : '#C09040',
        bgDark   : '#A87030',
        timeLimit: 40,
        lanes: [
            { row: 1, dir:  1, speed: 118, count: 3, type: 'moto',    color: '#8B0000', width: 56 },
            { row: 2, dir: -1, speed:  95, count: 3, type: 'porteur', color: '#4A2A5A', width: 66 },
            { row: 3, dir:  1, speed: 132, count: 2, type: 'moto',    color: '#A00010', width: 56 },
            { row: 5, dir: -1, speed: 100, count: 3, type: 'porteur', color: '#3A5A1E', width: 66 },
            { row: 6, dir:  1, speed: 115, count: 3, type: 'foule',   color: '#5A3A2A', width: 92 },
            { row: 7, dir: -1, speed: 108, count: 3, type: 'moto',    color: '#8B0000', width: 56 },
            { row: 8, dir:  1, speed: 125, count: 2, type: 'porteur', color: '#4A2A5A', width: 66 },
        ]
    },
    {
        id       : 3,
        name     : 'TRAVERSÉE',
        subtitle : 'La grande traversée',
        hint     : 'Timing parfait requis !',
        bgLight  : '#A07030',
        bgDark   : '#885020',
        timeLimit: 35,
        lanes: [
            { row: 1, dir:  1, speed: 162, count: 3, type: 'voiture', color: '#1A1A3E', width: 86 },
            { row: 2, dir: -1, speed: 142, count: 4, type: 'moto',    color: '#8B0000', width: 56 },
            { row: 3, dir:  1, speed: 182, count: 3, type: 'voiture', color: '#16213E', width: 86 },
            { row: 5, dir: -1, speed: 152, count: 4, type: 'foule',   color: '#2D1B69', width: 92 },
            { row: 6, dir:  1, speed: 172, count: 3, type: 'voiture', color: '#1A1A3E', width: 86 },
            { row: 7, dir: -1, speed: 148, count: 4, type: 'moto',    color: '#8B0000', width: 56 },
            { row: 8, dir:  1, speed: 192, count: 3, type: 'voiture', color: '#16213E', width: 86 },
        ]
    }
];
