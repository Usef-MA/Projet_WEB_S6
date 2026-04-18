// ═════════════════════════════════════════════════════════════
// BOULES DE BILLARD DÉCORATIVES — MENU
// Structure générée :
// .deco-ball
//   .ball-stripe       (rayées seulement)
//   .ball-white-disc
//     .ball-num
// ═════════════════════════════════════════════════════════════

const BALLS = [
    { num: 1,  color: "#f9d010", striped: false },
    { num: 2,  color: "#1a5fc8", striped: false },
    { num: 3,  color: "#e02020", striped: false },
    { num: 4,  color: "#7b2fa8", striped: false },
    { num: 5,  color: "#f07010", striped: false },
    { num: 6,  color: "#1a7c2e", striped: false },
    { num: 7,  color: "#8b2000", striped: false },
    { num: 8,  color: "#111111", striped: false, eight: true },
    { num: 9,  color: "#f9d010", striped: true },
    { num: 10, color: "#1a5fc8", striped: true },
    { num: 11, color: "#e02020", striped: true },
    { num: 12, color: "#7b2fa8", striped: true },
    { num: 13, color: "#f07010", striped: true },
    { num: 14, color: "#1a7c2e", striped: true },
    { num: 15, color: "#8b2000", striped: true }
  ];
  
  const POSITIONS = [
    { x: 6,  y: 8  },
    { x: 18, y: 20 },
    { x: 7,  y: 38 },
    { x: 4,  y: 60 },
    { x: 14, y: 78 },
    { x: 9,  y: 92 },
    { x: 94, y: 10 },
    { x: 84, y: 26 },
    { x: 93, y: 48 },
    { x: 86, y: 70 },
    { x: 96, y: 86 },
    { x: 80, y: 95 },
    { x: 36, y: 4  },
    { x: 64, y: 4  },
    { x: 50, y: 96 }
  ];
  
  const SIZES = [44, 52, 38, 56, 40, 46, 50, 62, 36, 48, 42, 54, 34, 46, 58];
  const DURATIONS = [4.2, 5.6, 3.9, 6.1, 4.8, 5.2, 3.7, 7.0, 4.5, 5.8, 4.0, 6.4, 3.5, 5.0, 4.7];
  
  function createBall(data, pos, size, duration) {
    const ball = document.createElement("div");
    ball.className = "deco-ball";
  
    if (data.striped) ball.classList.add("striped");
    if (data.eight) ball.classList.add("ball-eight");
  
    ball.style.width = size + "px";
    ball.style.height = size + "px";
    ball.style.left = pos.x + "%";
    ball.style.top = pos.y + "%";
    ball.style.background = data.striped ? "#f3f3f3" : data.color;
  
    const delay = -(Math.random() * duration).toFixed(2);
    ball.style.animationDuration = duration + "s";
    ball.style.animationDelay = delay + "s";
  
    if (data.striped) {
      const stripe = document.createElement("div");
      stripe.className = "ball-stripe";
      stripe.style.background = data.color;
      ball.appendChild(stripe);
    }
  
    const discSize = Math.round(size * 0.55);
    const disc = document.createElement("div");
    disc.className = "ball-white-disc";
    disc.style.width = discSize + "px";
    disc.style.height = discSize + "px";
  
    const num = document.createElement("span");
    num.className = "ball-num";
    num.textContent = data.num;
    num.style.fontSize = Math.round(discSize * 0.52) + "px";
  
    disc.appendChild(num);
    ball.appendChild(disc);
  
    return ball;
  }
  
  function initBalls() {
    const container = document.getElementById("balls-bg");
    if (!container) return;
  
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  
    BALLS.forEach((ball, i) => {
      const el = createBall(ball, POSITIONS[i], SIZES[i], DURATIONS[i]);
      container.appendChild(el);
    });
  }
  
  document.addEventListener("DOMContentLoaded", initBalls);