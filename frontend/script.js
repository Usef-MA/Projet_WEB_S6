// ===================================
// CONFIG
// ===================================

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000"
    : "https://aaro-gaming-backend.onrender.com"; // ← remplacer par l'URL Render après déploiement

// ===================================
// STARRY SKY BACKGROUND
// ===================================

particlesJS('particles-js', {
    particles: {
        number: { value: 150, density: { enable: true, value_area: 1000 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.6, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false } },
        size: { value: 2, random: true, anim: { enable: true, speed: 1, size_min: 0.3, sync: false } },
        line_linked: { enable: false },
        move: { enable: true, speed: 0.3, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
    },
    retina_detect: true
});

// ===================================
// AUTH MANAGER (JWT + API)
// ===================================

class AuthManager {
    constructor() {
        this.currentUser = this._loadUser();
        this.token = localStorage.getItem('aaroToken') || null;
    }

    _loadUser() {
        try {
            const u = localStorage.getItem('aaroUser');
            return u ? JSON.parse(u) : null;
        } catch { return null; }
    }

    _saveSession(token, user) {
        this.token = token;
        this.currentUser = user;
        localStorage.setItem('aaroToken', token);
        localStorage.setItem('aaroUser', JSON.stringify(user));
    }

    _clearSession() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('aaroToken');
        localStorage.removeItem('aaroUser');
    }

    async register(prenom, nom, email, password) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prenom, nom, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur serveur');
        this._saveSession(data.token, data.user);
        return data.user;
    }

    async login(email, password) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur serveur');
        this._saveSession(data.token, data.user);
        return data.user;
    }

    logout() {
        this._clearSession();
    }

    isLoggedIn() {
        return this.token !== null && this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }
}

const authManager = new AuthManager();

// ===================================
// NAVIGATION
// ===================================

const navbar      = document.querySelector('.navbar');
const menuToggle  = document.querySelector('.menu-toggle');
const navMenu     = document.querySelector('.nav-menu');
const navLinks    = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 100);
});

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const spans = menuToggle.querySelectorAll('span');
        const open  = navMenu.classList.contains('active');
        spans[0].style.transform = open ? 'rotate(45deg) translateY(8px)' : 'none';
        spans[1].style.opacity   = open ? '0' : '1';
        spans[2].style.transform = open ? 'rotate(-45deg) translateY(-8px)' : 'none';
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        navMenu.classList.remove('active');
    });
});

// ===================================
// MODALS (générique)
// ===================================

function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => closeModal(m.id));
    }
});

// Explore
const exploreBtn = document.getElementById('exploreBtn');
if (exploreBtn) exploreBtn.addEventListener('click', () => openModal('videoModal'));

// ===================================
// NAV AUTH : bouton login / compte
// ===================================

function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    if (authManager.isLoggedIn()) {
        const user = authManager.getCurrentUser();
        navAuth.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${user.prenom.toUpperCase()} ${user.nom.toUpperCase()}</span>
                <button class="btn-logout" id="btnLogout">DÉCONNEXION</button>
            </div>
        `;
        document.getElementById('btnLogout').addEventListener('click', () => {
            authManager.logout();
            updateNavAuth();
            showNotification('Vous êtes déconnecté', 'info');
        });
    } else {
        navAuth.innerHTML = `<button class="btn-login" id="btnLogin">SE CONNECTER</button>`;
        document.getElementById('btnLogin').addEventListener('click', () => {
            showAuthModal('login');
        });
    }
}

function showAuthModal(mode) {
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle    = document.getElementById('authTitle');
    const authMessage  = document.getElementById('authMessage');

    authMessage.style.display = 'none';

    if (mode === 'login') {
        loginForm.style.display    = 'block';
        registerForm.style.display = 'none';
        authTitle.textContent      = 'CONNEXION';
    } else {
        loginForm.style.display    = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent      = 'CRÉER UN COMPTE';
    }
    openModal('loginModal');
}

// Switch login ↔ register
document.getElementById('switchToRegister').addEventListener('click', (e) => {
    e.preventDefault(); showAuthModal('register');
});
document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault(); showAuthModal('login');
});

// ===================================
// AUTH FORMS
// ===================================

function setAuthMessage(text, type) {
    const el = document.getElementById('authMessage');
    el.textContent = text;
    el.className   = `auth-message auth-message-${type}`;
    el.style.display = 'block';
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn      = document.getElementById('loginSubmitBtn');
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Connexion...';

    try {
        const user = await authManager.login(email, password);
        closeModal('loginModal');
        updateNavAuth();
        showNotification(`Bienvenue ${user.prenom} !`, 'success');
        document.getElementById('loginForm').reset();
    } catch (err) {
        setAuthMessage(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'SE CONNECTER';
    }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn             = document.getElementById('registerSubmitBtn');
    const prenom          = document.getElementById('registerPrenom').value.trim();
    const nom             = document.getElementById('registerNom').value.trim();
    const email           = document.getElementById('registerEmail').value.trim();
    const password        = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        setAuthMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Création...';

    try {
        const user = await authManager.register(prenom, nom, email, password);
        closeModal('loginModal');
        updateNavAuth();
        showNotification(`Compte créé ! Bienvenue ${user.prenom} !`, 'success');
        document.getElementById('registerForm').reset();
    } catch (err) {
        setAuthMessage(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'CRÉER UN COMPTE';
    }
});

// ===================================
// BOUTONS JOUER
// ===================================

document.querySelectorAll('.btn-play').forEach(button => {
    button.addEventListener('click', () => {
        if (!authManager.isLoggedIn()) {
            showNotification('Veuillez vous connecter pour jouer !', 'warning');
            setTimeout(() => showAuthModal('login'), 800);
            return;
        }

        const gameId  = button.dataset.gameId;
        const gameUrl = button.dataset.gameUrl;

        const gamesWithUrl = ['marocrunner', 'soukdash'];

        if (gamesWithUrl.includes(gameId) && gameUrl) {
            // Passer le token au jeu via sessionStorage
            sessionStorage.setItem('aaroToken', authManager.getToken());
            sessionStorage.setItem('aaroUser', JSON.stringify(authManager.getCurrentUser()));
            window.location.href = gameUrl;
        } else {
            showNotification(`${gameId} — bientôt disponible !`, 'info');
        }
    });
});

// ===================================
// LEADERBOARD
// ===================================

document.querySelectorAll('.btn-scores').forEach(button => {
    button.addEventListener('click', async () => {
        const gameId   = button.dataset.gameId;
        const gameName = button.dataset.gameName;

        document.getElementById('leaderboardTitle').textContent = `CLASSEMENT — ${gameName.toUpperCase()}`;
        document.getElementById('leaderboardContent').innerHTML = '<div class="leaderboard-loading">Chargement...</div>';
        openModal('leaderboardModal');

        try {
            const res  = await fetch(`${API_URL}/scores/${gameId}`);
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                document.getElementById('leaderboardContent').innerHTML =
                    '<p class="leaderboard-empty">Aucun score enregistré pour ce jeu.</p>';
                return;
            }

            let html = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Joueur</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.forEach((entry, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                const rowClass = i < 3 ? `rank-${i + 1}` : '';
                html += `
                    <tr class="${rowClass}">
                        <td class="rank-cell">${medal}</td>
                        <td>${entry.prenom} ${entry.nom}</td>
                        <td class="score-cell">${entry.score.toLocaleString()}</td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            document.getElementById('leaderboardContent').innerHTML = html;
        } catch {
            document.getElementById('leaderboardContent').innerHTML =
                '<p class="leaderboard-empty">Impossible de charger les scores.</p>';
        }
    });
});

// ===================================
// CONTACT FORM
// ===================================

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification('Message envoyé avec succès !', 'success');
        contactForm.reset();
    });
}

// ===================================
// NOTIFICATIONS
// ===================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position:   'fixed',
        top:        '100px',
        right:      '20px',
        padding:    '1rem 2rem',
        background: type === 'success' ? 'rgba(0, 255, 136, 0.95)' :
                    type === 'warning' ? 'rgba(255, 193, 7, 0.95)' :
                    type === 'error'   ? 'rgba(244, 67, 54, 0.95)' :
                                         'rgba(33, 150, 243, 0.95)',
        color:        '#000000',
        border:       `2px solid ${type === 'success' ? '#00ff88' : type === 'warning' ? '#ffc107' : type === 'error' ? '#f44336' : '#2196f3'}`,
        borderRadius: '10px',
        fontFamily:   'Orbitron, sans-serif',
        fontWeight:   '700',
        fontSize:     '0.9rem',
        zIndex:       '3000',
        boxShadow:    '0 10px 30px rgba(0,0,0,0.5)',
        animation:    'slideInRight 0.3s ease',
        cursor:       'pointer',
        maxWidth:     '320px'
    });

    if (!document.querySelector('style[data-notifications]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notifications', 'true');
        style.textContent = `
            @keyframes slideInRight  { from { transform: translateX(400px); opacity:0; } to { transform: translateX(0); opacity:1; } }
            @keyframes slideOutRight { from { transform: translateX(0); opacity:1; } to { transform: translateX(400px); opacity:0; } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    const dismiss = () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    };
    notification.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
}

// ===================================
// SCROLL ANIMATIONS
// ===================================

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.products-section, .innovations-section, .contact-section').forEach(s => {
    s.style.opacity   = '0';
    s.style.transform = 'translateY(50px)';
    s.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(s);
});

document.querySelectorAll('.game-card').forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
    observer.observe(card);
});

// ===================================
// INIT
// ===================================

window.addEventListener('load', () => {
    updateNavAuth();
    document.body.style.opacity = '1';
});

// Konami code easter egg
let konamiCode = [];
const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    if (konamiCode.length > konamiSeq.length) konamiCode.shift();
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSeq)) {
        showNotification('🎮 Code secret activé ! AARO Mode Unlocked!', 'success');
        konamiCode = [];
    }
});
