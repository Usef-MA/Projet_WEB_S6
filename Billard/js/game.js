/**
 * game.js — Moteur de jeu complet : physique, rendu, IA, règles
 * Dev A
 */

(() => {
'use strict';

// ─── Imports depuis common.js ─────────────────────────────────────────────────
const { TABLE, BALL, BALL_COLORS, getPockets, getRackPositions, Vec2,
        clamp, randRange, degToRad } = window.BillardCommon;

// ─── Éléments DOM ─────────────────────────────────────────────────────────────
const canvas      = document.getElementById('game-canvas');
const ctx         = canvas.getContext('2d');
const hudTurn     = document.getElementById('hud-turn');
const hudPGroup   = document.getElementById('hud-player-group');
const hudAIGroup  = document.getElementById('hud-ai-group');
const hudRemain   = document.getElementById('hud-remaining');
const diffBadge   = document.getElementById('difficulty-badge');
const statusBar   = document.getElementById('status-bar');
const endOverlay  = document.getElementById('end-overlay');
const endTitle    = document.getElementById('end-title');
const endSubtitle = document.getElementById('end-subtitle');
const btnReplay   = document.getElementById('btn-replay');
const powerCont   = document.getElementById('power-bar-container');
const powerFill   = document.getElementById('power-bar-fill');
const powerPct    = document.getElementById('power-pct');

// ─── CONSTANTES DE JEU ────────────────────────────────────────────────────────
const PLAY_LEFT   = TABLE.CUSHION;
const PLAY_RIGHT  = TABLE.WIDTH  - TABLE.CUSHION;
const PLAY_TOP    = TABLE.CUSHION;
const PLAY_BOTTOM = TABLE.HEIGHT - TABLE.CUSHION;

// ─── ÉTAT DU JEU ──────────────────────────────────────────────────────────────
let balls      = [];
let pockets    = [];
let gamePhase  = 'idle';        // 'idle' | 'moving' | 'ai_thinking' | 'gameover'
let turn       = 'player';      // 'player' | 'ai'
let playerGroup = null;         // null | 'solids' | 'stripes'
let aiGroup     = null;
let faultThisTurn = false;
let gameStartTime = 0;

// Souris / visée
let aiming       = false;
let aimStart     = null;        // {x,y} point de départ du drag
let aimCurrent   = null;        // {x,y} position actuelle de la souris

// Difficulté (lue depuis gameConfig)
let difficulty = 'medium';

// ─── CLASSE BILLE ─────────────────────────────────────────────────────────────
class BilliardBall {
  constructor(num, x, y) {
    this.num    = num;
    this.x      = x;
    this.y      = y;
    this.vx     = 0;
    this.vy     = 0;
    this.active = true;   // false = empochée
  }

  get isMoving() {
    return Math.abs(this.vx) > BALL.MIN_SPEED || Math.abs(this.vy) > BALL.MIN_SPEED;
  }

  get isCue()    { return this.num === 0; }
  get isSolid()  { return this.num >= 1 && this.num <= 7; }
  get isStripe() { return this.num >= 9 && this.num <= 15; }
  get isBlack()  { return this.num === 8; }
}

// ─── INITIALISATION ───────────────────────────────────────────────────────────
function init() {
  difficulty = (window.gameConfig && window.gameConfig.difficulty) || 'medium';
  
  AudioManager.init();
  AudioManager.playMusic();

  pockets    = getPockets();

  // Réinitialiser l'état
  balls       = [];
  playerGroup = null;
  aiGroup     = null;
  turn        = 'player';
  faultThisTurn = false;
  gamePhase   = 'idle';
  aiming      = false;
  aimStart    = null;
  aimCurrent  = null;
  gameStartTime = Date.now();

  // Créer les billes
  getRackPositions().forEach(({ num, x, y }) => {
    balls.push(new BilliardBall(num, x, y));
  });

  // UI
  updateDifficultyBadge();
  updateHUD();
  setStatus('À vous de jouer — cliquez et glissez pour tirer', 'info');
  endOverlay.classList.remove('visible');
  canvas.classList.remove('no-interact');

  // Notifier common.js
  window.gameState.currentGame = { started: true, difficulty };

  
}

// ─── BOUCLE DE JEU ────────────────────────────────────────────────────────────
function gameLoop() {
  if (gamePhase === 'moving' || gamePhase === 'resolving') {
    if (gamePhase === 'moving') update();
  }
  render();
  requestAnimationFrame(gameLoop);
}

// ─── UPDATE (physique) ────────────────────────────────────────────────────────
function update() {
  // Déplacer + friction
  balls.forEach(b => {
    if (!b.active) return;
    b.x  += b.vx;
    b.y  += b.vy;
    b.vx *= BALL.FRICTION;
    b.vy *= BALL.FRICTION;
    if (Math.abs(b.vx) < BALL.MIN_SPEED) b.vx = 0;
    if (Math.abs(b.vy) < BALL.MIN_SPEED) b.vy = 0;
  });

  // !! Empochage EN PREMIER — avant les rebonds mur
  // Sinon la bille rebondit sur le cushion avant d'atteindre le trou
  checkPockets();

  // Collisions mur (seulement pour les billes encore actives)
  balls.forEach(b => {
    if (!b.active) return;
    wallCollision(b);
  });

  // Collisions bille/bille
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (!balls[i].active || !balls[j].active) continue;
      ballCollision(balls[i], balls[j]);
    }
  }

  // Fin du mouvement ?
  if (!balls.some(b => b.active && b.isMoving)) {
    gamePhase = 'resolving'; // guard : bloque les appels multiples
    endTurn();
  }
}

// ─── COLLISION MUR ────────────────────────────────────────────────────────────
function wallCollision(b) {
  const R = BALL.RADIUS;
  const E = BALL.RESTITUTION;

  if (b.x - R < PLAY_LEFT) {
    b.x  = PLAY_LEFT + R;
    b.vx = Math.abs(b.vx) * E;
  } else if (b.x + R > PLAY_RIGHT) {
    b.x  = PLAY_RIGHT - R;
    b.vx = -Math.abs(b.vx) * E;
  }

  if (b.y - R < PLAY_TOP) {
    b.y  = PLAY_TOP + R;
    b.vy = Math.abs(b.vy) * E;
  } else if (b.y + R > PLAY_BOTTOM) {
    b.y  = PLAY_BOTTOM - R;
    b.vy = -Math.abs(b.vy) * E;
  }
}

// ─── COLLISION BILLE/BILLE ────────────────────────────────────────────────────
function ballCollision(a, b) {
  const dx   = b.x - a.x;
  const dy   = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minD = BALL.RADIUS * 2;

  if (dist >= minD || dist === 0) return;

  // Séparer les billes (overlap)
  const overlap = (minD - dist) / 2;
  const nx = dx / dist;
  const ny = dy / dist;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;

  // Vitesse relative sur l'axe normal
  const dvx = b.vx - a.vx;
  const dvy = b.vy - a.vy;
  const dvn = dvx * nx + dvy * ny;

  if (dvn >= 0) return; // les billes s'éloignent déjà
  playHitSound();
  const impulse = dvn * BALL.RESTITUTION;
  a.vx += impulse * nx;
  a.vy += impulse * ny;
  b.vx -= impulse * nx;
  b.vy -= impulse * ny;
}

let lastHitSoundTime = 0;

function playHitSound() {
  const now = Date.now();
  if (now - lastHitSoundTime < 80) return;
  lastHitSoundTime = now;
  AudioManager.play("hit");
}

// ─── DÉTECTION EMPOCHAGE ──────────────────────────────────────────────────────
function checkPockets() {
  const potted = [];
  balls.forEach(b => {
    if (!b.active) return;
    pockets.forEach(p => {
      if (Vec2.dist(b, p) < TABLE.POCKET_RADIUS + BALL.RADIUS) {
        b.active = false;
        b.vx = 0;
        b.vy = 0;
        potted.push(b);
      }
    });
  });

  potted.forEach(b => handlePotted(b));
}

// ─── GESTION D'UN EMPOCHAGE ───────────────────────────────────────────────────
let pottedThisTurn = []; // réinitialisé au début de chaque tir

function handlePotted(b) {
  AudioManager.play("pocket");
  if (b.isCue) {
    faultThisTurn = true;
    return;
  }

  if (b.isBlack) {
    // Vérifier si le joueur actif a fini ses billes
    const currentGroup = turn === 'player' ? playerGroup : aiGroup;
    const myBalls = balls.filter(x => x.active && !x.isCue && !x.isBlack &&
      (currentGroup === 'solids' ? x.isSolid : x.isStripe));

    if (myBalls.length === 0 && currentGroup !== null) {
      // Victoire !
      endGame(turn === 'player' ? 'win' : 'lose');
    } else {
      // Empochée trop tôt ou faute → adversaire gagne
      endGame(turn === 'player' ? 'lose' : 'win');
    }
    return;
  }

  pottedThisTurn.push(b);

  // Attribution des groupes au premier empochage valide
  if (playerGroup === null) {
    if (turn === 'player') {
      playerGroup = b.isSolid ? 'solids' : 'stripes';
      aiGroup     = b.isSolid ? 'stripes' : 'solids';
    } else {
      aiGroup     = b.isSolid ? 'solids' : 'stripes';
      playerGroup = b.isSolid ? 'stripes' : 'solids';
    }
  }
}

// ─── FIN DE TOUR ──────────────────────────────────────────────────────────────
function endTurn() {
  if (gamePhase === 'gameover') return;

  const scoredForMe = pottedThisTurn.filter(b => {
    if (turn === 'player') return playerGroup === null || (playerGroup === 'solids' ? b.isSolid : b.isStripe);
    return aiGroup === null || (aiGroup === 'solids' ? b.isSolid : b.isStripe);
  });

  const keepTurn = scoredForMe.length > 0 && !faultThisTurn;

  pottedThisTurn = [];

  if (faultThisTurn) {
    setStatus('Faute ! La bille blanche est replacée.', 'fault');
    repositionCueBall();
    faultThisTurn = false;
    // Le tour passe à l'adversaire
    switchTurn();
  } else if (!keepTurn) {
    switchTurn();
  } else {
    // Rejoue
    gamePhase = turn === 'player' ? 'idle' : 'ai_thinking';
    if (turn === 'player') {
      setStatus('Bonne poche ! Rejouez.', 'success');
    } else {
      scheduleAI();
    }
  }

  updateHUD();
}

function switchTurn() {
  if (gamePhase === 'gameover') return;
  turn = turn === 'player' ? 'ai' : 'player';
  updateHUD();

  if (turn === 'player') {
    gamePhase = 'idle';
    setStatus('À vous de jouer.', 'info');
    canvas.classList.remove('no-interact');
  } else {
    gamePhase = 'ai_thinking';
    canvas.classList.add('no-interact');
    setStatus("L'IA réfléchit…", 'ai');
    scheduleAI();
  }
}

function repositionCueBall() {
  const cue = getCueBall();
  if (!cue) {
    // Remettre la bille blanche en jeu
    const newCue = new BilliardBall(0, TABLE.WIDTH * 0.25, TABLE.HEIGHT / 2);
    balls.push(newCue);
    return;
  }
  cue.active = true;
  // Zone de placement libre dans le quart gauche
  cue.x  = TABLE.WIDTH * 0.25;
  cue.y  = TABLE.HEIGHT / 2;
  cue.vx = 0;
  cue.vy = 0;
}

// ─── GETTERS UTILES ───────────────────────────────────────────────────────────
function getCueBall()    { return balls.find(b => b.isCue && b.active); }
function getActiveBalls(){ return balls.filter(b => b.active && !b.isCue); }

function remainingForGroup(group) {
  return balls.filter(b => b.active && (group === 'solids' ? b.isSolid : b.isStripe)).length;
}

// ─── TIR ──────────────────────────────────────────────────────────────────────
function shoot(dx, dy) {
  const cue = getCueBall();
  if (!cue) return;

  const power = clamp(Math.sqrt(dx * dx + dy * dy) / 120, 0, 1);
  cue.vx = -dx / 120 * BALL.MAX_SHOT_POWER * power * (1 / power || 0);
  cue.vy = -dy / 120 * BALL.MAX_SHOT_POWER * power * (1 / power || 0);

  // Recalcul propre
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const force = clamp(len / 120, 0, 1) * BALL.MAX_SHOT_POWER;
  cue.vx = -(dx / len) * force;
  cue.vy = -(dy / len) * force;

  AudioManager.play("shoot");

  pottedThisTurn = [];
  faultThisTurn  = false;
  gamePhase      = 'moving';
  aiming         = false;
  hidePowerBar();
}

// ─── IA ───────────────────────────────────────────────────────────────────────
function scheduleAI() {
  const delays = { easy: 1800, medium: 1500, hard: 1000 };
  const delay  = delays[difficulty] || 1500;
  setTimeout(() => {
    if (gamePhase !== 'ai_thinking') return;
    aiShoot();
  }, delay);
}

function aiShoot() {
  const cue = getCueBall();
  if (!cue) return;

  const myGroup = aiGroup;
  let targets;

  if (myGroup === null) {
    targets = balls.filter(b => b.active && !b.isCue && !b.isBlack);
  } else {
    const remaining = remainingForGroup(myGroup);
    if (remaining === 0) {
      // Doit empocher la noire
      targets = balls.filter(b => b.active && b.isBlack);
    } else {
      targets = balls.filter(b => b.active && (myGroup === 'solids' ? b.isSolid : b.isStripe));
    }
  }

  if (targets.length === 0) return;

  let targetBall;
  let aimX, aimY;

  if (difficulty === 'easy') {
    targetBall = targets[Math.floor(Math.random() * targets.length)];
    const errRad = degToRad(randRange(-25, 25));
    const baseAngle = Math.atan2(targetBall.y - cue.y, targetBall.x - cue.x) + errRad;
    const dist = Vec2.dist(cue, targetBall);
    aimX = cue.x + Math.cos(baseAngle) * dist;
    aimY = cue.y + Math.sin(baseAngle) * dist;
    const forcePct = randRange(0.4, 0.7);
    fireAI(cue, aimX, aimY, forcePct);

  } else if (difficulty === 'medium') {
    // Choisir la bille la plus proche
    targetBall = targets.reduce((best, b) =>
      Vec2.dist(cue, b) < Vec2.dist(cue, best) ? b : best
    );
    const errRad = degToRad(randRange(-8, 8));
    const baseAngle = Math.atan2(targetBall.y - cue.y, targetBall.x - cue.x) + errRad;
    const dist = Vec2.dist(cue, targetBall);
    aimX = cue.x + Math.cos(baseAngle) * dist;
    aimY = cue.y + Math.sin(baseAngle) * dist;
    const adaptedForce = clamp(dist / (TABLE.WIDTH * 0.6), 0.35, 0.85);
    fireAI(cue, aimX, aimY, adaptedForce);

  } else {
    // DIFFICILE : calcul du point de contact optimal
    targetBall = chooseBestTarget(cue, targets);
    const contactPt = computeContactPoint(cue, targetBall);
    const errRad = degToRad(randRange(-2, 2));
    const baseAngle = Math.atan2(contactPt.y - cue.y, contactPt.x - cue.x) + errRad;
    const dist = Vec2.dist(cue, contactPt);
    aimX = cue.x + Math.cos(baseAngle) * dist;
    aimY = cue.y + Math.sin(baseAngle) * dist;
    const smartForce = computeSmartForce(cue, targetBall);
    fireAI(cue, aimX, aimY, smartForce);
  }

  pottedThisTurn = [];
  faultThisTurn  = false;
  gamePhase      = 'moving';
}

/** Tire vers le point (tx, ty) avec une force en fraction de MAX */
function fireAI(cue, tx, ty, forcePct) {
  const dx  = tx - cue.x;
  const dy  = ty - cue.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const force = clamp(forcePct, 0, 1) * BALL.MAX_SHOT_POWER;
  cue.vx = (dx / len) * force;
  cue.vy = (dy / len) * force;
}

/** Choisit la bille cible avec le meilleur angle vers un trou (mode hard) */
function chooseBestTarget(cue, targets) {
  let bestScore = -Infinity;
  let best = targets[0];

  targets.forEach(b => {
    pockets.forEach(p => {
      // Angle entre (cue→b) et (b→pocket)
      const v1 = Vec2.norm({ x: b.x - cue.x, y: b.y - cue.y });
      const v2 = Vec2.norm({ x: p.x - b.x,   y: p.y - b.y });
      const alignment = Vec2.dot(v1, v2); // 1 = parfait alignement
      const distScore = 1 / (Vec2.dist(cue, b) + 1);
      const score = alignment * 0.7 + distScore * 0.3;
      if (score > bestScore) { bestScore = score; best = b; }
    });
  });

  return best;
}

/**
 * Calcule le point où la cue ball doit percuter la bille cible
 * pour envoyer celle-ci en direction du meilleur trou.
 */
function computeContactPoint(cue, target) {
  // Trouver le meilleur trou pour cette bille
  let bestPocket = pockets[0];
  let bestAlign  = -Infinity;

  pockets.forEach(p => {
    const v1 = Vec2.norm({ x: target.x - cue.x, y: target.y - cue.y });
    const v2 = Vec2.norm({ x: p.x - target.x,   y: p.y - target.y });
    const a  = Vec2.dot(v1, v2);
    if (a > bestAlign) { bestAlign = a; bestPocket = p; }
  });

  // La cue doit arriver de l'opposé de la direction (target→pocket)
  const dirToPocket = Vec2.norm({ x: bestPocket.x - target.x, y: bestPocket.y - target.y });
  return {
    x: target.x - dirToPocket.x * BALL.RADIUS * 2,
    y: target.y - dirToPocket.y * BALL.RADIUS * 2
  };
}

/** Force adaptative selon la distance (mode hard) */
function computeSmartForce(cue, target) {
  const dist = Vec2.dist(cue, target);
  return clamp(dist / (TABLE.WIDTH * 0.55), 0.3, 0.9);
}

// ─── FIN DE PARTIE ────────────────────────────────────────────────────────────
function endGame(result) {
  gamePhase = 'gameover';
  canvas.classList.add('no-interact');

  const duration = Math.round((Date.now() - gameStartTime) / 1000);

  // Écrire le score pour Dev B
  window.gameState.scores.push({
    date: new Date().toISOString(),
    result,
    difficulty,
    duration
  });
  window.gameState.currentGame = null;

  endTitle.textContent = result === 'win' ? 'Vous gagnez !' : 'Vous perdez…';
  endTitle.className   = result === 'win' ? 'win' : 'lose';

  if (result === 'win' && window.BillardScoreManager) {
    const score = window.BillardScoreManager.computeScore(duration, difficulty);
    const isRecord = window.BillardScoreManager.saveLocalHighScore(score);
    window.BillardScoreManager.submitScore(score);
    endSubtitle.textContent = `Score : ${score} pts${isRecord ? ' 🏆 Record !' : ''} · ${Math.floor(duration / 60)}m ${duration % 60}s · ${difficulty}`;
  } else {
    endSubtitle.textContent = `Durée : ${Math.floor(duration / 60)}m ${duration % 60}s · Difficulté : ${difficulty}`;
  }

  // Message connexion AARO
  const authMsg = document.getElementById('end-auth-msg');
  if (authMsg) {
    const isAuth = !!(sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken'));
    authMsg.style.display = (result === 'win' && !isAuth) ? 'block' : 'none';
  }

  endOverlay.classList.add('visible');

  setStatus(result === 'win' ? 'Félicitations !' : "L'IA a gagné cette fois.", result === 'win' ? 'success' : 'fault');
}

// ─── CONTRÔLES SOURIS ────────────────────────────────────────────────────────
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY
  };
}

canvas.addEventListener('mousedown', e => {
  if (gamePhase !== 'idle' || turn !== 'player') return;
  const cue = getCueBall();
  if (!cue) return;

  const pos  = getCanvasPos(e);
  const dist = Vec2.dist(pos, cue);
  // Commence l'aim depuis n'importe où sur le canvas (pas seulement sur la bille)
  aiming     = true;
  aimStart   = pos;
  aimCurrent = pos;
  e.preventDefault();
});

canvas.addEventListener('mousemove', e => {
  if (!aiming) return;
  aimCurrent = getCanvasPos(e);

  // Mise à jour barre de puissance
  const cue = getCueBall();
  if (cue) {
    const dx    = aimCurrent.x - aimStart.x;
    const dy    = aimCurrent.y - aimStart.y;
    const len   = Math.sqrt(dx * dx + dy * dy);
    const pct   = Math.round(clamp(len / 120, 0, 1) * 100);
    powerFill.style.width = pct + '%';
    powerPct.textContent  = pct + '%';
    powerCont.classList.add('visible');
  }
  e.preventDefault();
});

canvas.addEventListener('mouseup', e => {
  if (!aiming) return;
  const pos = getCanvasPos(e);
  const dx  = pos.x - aimStart.x;
  const dy  = pos.y - aimStart.y;
  aiming = false;
  hidePowerBar();

  if (Math.sqrt(dx * dx + dy * dy) < 4) return; // clic sans drag
  shoot(dx, dy);
  e.preventDefault();
});

canvas.addEventListener('mouseleave', () => {
  if (aiming) {
    aiming = false;
    hidePowerBar();
  }
});

// Support tactile basique
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY }));
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  const t = e.touches[0];
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: t.clientX, clientY: t.clientY }));
  e.preventDefault();
}, { passive: false });

function hidePowerBar() {
  powerCont.classList.remove('visible');
  powerFill.style.width = '0%';
  powerPct.textContent  = '0%';
}

// ─── REJOUER ──────────────────────────────────────────────────────────────────
btnReplay.addEventListener('click', init);

// ─── HUD / STATUS ─────────────────────────────────────────────────────────────
function updateHUD() {
  hudTurn.textContent = turn === 'player'
    ? (window.gameConfig.playerName || 'Joueur')
    : 'IA';
  hudTurn.className = 'hud-value active-player';

  const toLabel = g => g === 'solids' ? 'Pleines' : g === 'stripes' ? 'Rayées' : '—';
  const toCls   = g => g === 'solids' ? 'group-solids' : g === 'stripes' ? 'group-stripes' : 'group-none';

  hudPGroup.textContent = toLabel(playerGroup);
  hudPGroup.className   = 'hud-value ' + toCls(playerGroup);
  hudAIGroup.textContent = toLabel(aiGroup);
  hudAIGroup.className   = 'hud-value ' + toCls(aiGroup);

  hudRemain.textContent = getActiveBalls().filter(b => !b.isBlack).length;
}

function setStatus(msg, type = 'info') {
  statusBar.textContent = msg;
  statusBar.className   = type;
}

function updateDifficultyBadge() {
  const labels = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
  diffBadge.textContent = labels[difficulty] || 'Moyen';
  diffBadge.className   = difficulty;
}

// ─── RENDU ────────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTable();
  drawPockets();
  drawBalls();
  if (aiming && gamePhase === 'idle' && turn === 'player') {
    drawAimLine();
  }
}

// ── Table marocaine ────────────────────────────────────────────────────────────
function drawTable() {
  const { WIDTH, HEIGHT, CUSHION, RAIL_COLOR, RAIL_DARK, FELT_COLOR, FELT_SHADOW } = TABLE;

  // Rail bois sombre marocain
  const railGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  railGrad.addColorStop(0,   RAIL_COLOR);
  railGrad.addColorStop(0.5, '#2a0f00');
  railGrad.addColorStop(1,   RAIL_DARK);
  ctx.fillStyle = railGrad;
  ctx.beginPath();
  ctx.roundRect(0, 0, WIDTH, HEIGHT, 10);
  ctx.fill();

  // Bordure dorée arabesques sur le rail
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(3, 3, WIDTH - 6, HEIGHT - 6, 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,55,0.2)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.roundRect(7, 7, WIDTH - 14, HEIGHT - 14, 6);
  ctx.stroke();

  // Motif zellige sur les rails (losanges légers)
  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.12)';
  ctx.lineWidth = 0.8;
  const step = 18;
  for (let x = 0; x < WIDTH; x += step) {
    for (let y = 0; y < HEIGHT; y += step) {
      // Seulement dans la zone du rail (pas sur le tapis)
      if (x > CUSHION - step && x < WIDTH - CUSHION && y > CUSHION - step && y < HEIGHT - CUSHION) continue;
      ctx.beginPath();
      ctx.moveTo(x + step/2, y);
      ctx.lineTo(x + step, y + step/2);
      ctx.lineTo(x + step/2, y + step);
      ctx.lineTo(x, y + step/2);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // Étoiles marocaines aux 4 coins du rail
  const corners = [[20,20],[WIDTH-20,20],[20,HEIGHT-20],[WIDTH-20,HEIGHT-20]];
  corners.forEach(([cx, cy]) => drawRailStar(cx, cy, 8));

  // Tapis bordeaux
  const feltGrad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 60, WIDTH/2, HEIGHT/2, WIDTH*0.65);
  feltGrad.addColorStop(0, FELT_COLOR);
  feltGrad.addColorStop(1, FELT_SHADOW);
  ctx.fillStyle = feltGrad;
  ctx.fillRect(CUSHION, CUSHION, WIDTH - CUSHION*2, HEIGHT - CUSHION*2);

  // Ligne centrale (trait de rack)
  ctx.strokeStyle = 'rgba(212,175,55,0.18)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.25, CUSHION + 10);
  ctx.lineTo(WIDTH * 0.25, HEIGHT - CUSHION - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rebord intérieur doré
  ctx.strokeStyle = 'rgba(212,175,55,0.22)';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(CUSHION + 1, CUSHION + 1, WIDTH - CUSHION*2 - 2, HEIGHT - CUSHION*2 - 2);
}

function drawRailStar(cx, cy, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(212,175,55,0.5)';
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle  = (i * Math.PI) / 4;
    const radius = i % 2 === 0 ? size : size * 0.42;
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    else         ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Trous ──────────────────────────────────────────────────────────────────────
function drawPockets() {
  pockets.forEach(p => {
    // Halo externe
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, TABLE.POCKET_RADIUS + 4);
    grad.addColorStop(0,   'rgba(0,0,0,0.9)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.6)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, TABLE.POCKET_RADIUS + 4, 0, Math.PI * 2);
    ctx.fill();

    // Trou noir
    ctx.fillStyle = TABLE.POCKET_COLOR;
    ctx.beginPath();
    ctx.arc(p.x, p.y, TABLE.POCKET_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Anneau intérieur
    ctx.strokeStyle = 'rgba(80,40,10,0.7)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, TABLE.POCKET_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  });
}

// ── Billes ────────────────────────────────────────────────────────────────────
function drawBalls() {
  balls.forEach(b => {
    if (!b.active) return;
    drawBall(b);
  });
}

function drawBall(b) {
  const R   = BALL.RADIUS;
  const col = BALL_COLORS[b.num] || '#ffffff';

  // Ombre portée
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur    = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  if (b.isStripe) {
    // Base blanche
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ece0';
    ctx.fill();
    ctx.restore(); ctx.save();

    // Bande colorée (clip sur la bille)
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = col;
    ctx.fillRect(b.x - R, b.y - R * 0.45, R * 2, R * 0.9);
  } else {
    // Bille pleine
    const grad = ctx.createRadialGradient(b.x - R*0.3, b.y - R*0.3, R*0.1, b.x, b.y, R);
    grad.addColorStop(0,   lighten(col, 0.35));
    grad.addColorStop(0.5, col);
    grad.addColorStop(1,   darken(col, 0.3));
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();

  // Contour
  ctx.beginPath();
  ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Reflet spéculaire
  ctx.beginPath();
  ctx.arc(b.x - R*0.28, b.y - R*0.32, R*0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  // Numéro (sauf bille blanche)
  if (b.num > 0) {
    // Petit cercle blanc pour le numéro
    ctx.beginPath();
    ctx.arc(b.x, b.y, R * 0.44, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();

    ctx.fillStyle   = '#222';
    ctx.font        = `bold ${R * 0.65}px system-ui`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(b.num), b.x, b.y + 0.5);
  }
}

// ── Ligne de visée ─────────────────────────────────────────────────────────────
function drawAimLine() {
  const cue = getCueBall();
  if (!cue || !aimStart || !aimCurrent) return;

  const dx  = aimCurrent.x - aimStart.x;
  const dy  = aimCurrent.y - aimStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;

  // Direction du tir = opposé du drag
  const nx = -dx / len;
  const ny = -dy / len;

  const power = clamp(len / 120, 0, 1);

  // Ligne de visée (pointillés)
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = `rgba(255,255,255,${0.25 + power * 0.4})`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);

  // Simuler la trajectoire jusqu'au premier rebond ou bille
  const endPt = traceRay(cue.x, cue.y, nx, ny, 400);
  ctx.lineTo(endPt.x, endPt.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Flèche de direction au bout de la ligne
  const arrowLen = 14;
  const arrowAngle = 0.45;
  const angle = Math.atan2(ny, nx);
  ctx.strokeStyle = `rgba(255,220,80,${0.5 + power * 0.5})`;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(endPt.x, endPt.y);
  ctx.lineTo(endPt.x - Math.cos(angle - arrowAngle) * arrowLen,
             endPt.y - Math.sin(angle - arrowAngle) * arrowLen);
  ctx.moveTo(endPt.x, endPt.y);
  ctx.lineTo(endPt.x - Math.cos(angle + arrowAngle) * arrowLen,
             endPt.y - Math.sin(angle + arrowAngle) * arrowLen);
  ctx.stroke();

  // Cercle de force autour de la cue ball
  ctx.beginPath();
  ctx.arc(cue.x, cue.y, BALL.RADIUS + 3, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,220,80,${0.3 + power * 0.5})`;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Trace un rayon depuis (ox,oy) dans la direction (nx,ny)
 * et retourne le point d'impact (mur ou bille).
 */
function traceRay(ox, oy, nx, ny, maxLen) {
  const R  = BALL.RADIUS;
  let   tMin = maxLen;

  // Test murs
  if (nx > 0) tMin = Math.min(tMin, (PLAY_RIGHT  - R - ox) / nx);
  if (nx < 0) tMin = Math.min(tMin, (PLAY_LEFT   + R - ox) / nx);
  if (ny > 0) tMin = Math.min(tMin, (PLAY_BOTTOM - R - oy) / ny);
  if (ny < 0) tMin = Math.min(tMin, (PLAY_TOP    + R - oy) / ny);

  // Test billes
  balls.forEach(b => {
    if (!b.active) return;
    const dx = b.x - ox;
    const dy = b.y - oy;
    const tc = dx * nx + dy * ny;
    if (tc < 0) return;
    const perp2 = (dx*dx + dy*dy) - tc*tc;
    const minD  = R * 2;
    if (perp2 > minD * minD) return;
    const dt = Math.sqrt(Math.max(0, minD*minD - perp2));
    const t  = tc - dt;
    if (t > 0 && t < tMin) tMin = t;
  });

  return { x: ox + nx * tMin, y: oy + ny * tMin };
}

// ─── HELPERS COULEUR ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function lighten(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  const f = v => Math.min(255, Math.round(v + (255-v)*amt));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function darken(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  const f = v => Math.max(0, Math.round(v * (1-amt)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// ─── RESPONSIVE — redimensionnement du wrapper ────────────────────────────────
function resizeGame() {
  const wrapper   = document.getElementById('game-wrapper');
  const available = Math.min(window.innerWidth - 32, 900);
  const scale     = available / 900;
  wrapper.style.transform      = scale < 1 ? `scale(${scale.toFixed(3)})` : '';
  wrapper.style.transformOrigin = 'top center';
  // Ajuste la hauteur du body pour éviter le scroll fantôme
  document.body.style.minHeight = scale < 1
    ? Math.ceil((500 + 160) * scale + 80) + 'px'
    : '';
}
window.addEventListener('resize', resizeGame);

// ─── DÉMARRAGE ────────────────────────────────────────────────────────────────
init();
requestAnimationFrame(gameLoop);
resizeGame();

// ─── Bouton retour au menu ─────────────────────────────────────────────────
document.getElementById("btn-back").addEventListener("click", (e) => {
  e.preventDefault();
  if (confirm("Quitter la partie en cours ?")) {
    window.location.href = "menu.html";
  }
});

// ─── Touche H → accueil AARO ──────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') {
    if (confirm("Retourner à l'accueil AARO ?")) {
      window.location.href = '../frontend/index.html';
    }
  }
});
})();
