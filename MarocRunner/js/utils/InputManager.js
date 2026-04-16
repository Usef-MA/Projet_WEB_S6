// Gestion centralisée des inputs - BONNE PRATIQUE
export default class InputManager {
    constructor() {
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseClicked = false;
        
        // Système de saut variable - NOUVEAU
        this.spacePressed = false;
        this.spacePressTime = 0;
        this.spaceJustPressed = false;
        this.spaceJustReleased = false;
        this.maxHoldTime = 0.4; // 400ms max
        
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            // Détecte le premier appui sur espace
            if ((e.key === ' ' || e.key === 'ArrowUp') && !this.keys[e.key]) {
                this.spaceJustPressed = true;
                this.spacePressed = true;
                this.spacePressTime = 0;
            }
            
            this.keys[e.key] = true;
            
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            
            if (e.key === ' ' || e.key === 'ArrowUp') {
                this.spaceJustReleased = true;
                this.spacePressed = false;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.mouseClicked) {
                this.spaceJustPressed = true;
                this.spacePressed = true;
                this.spacePressTime = 0;
            }
            this.mouseClicked = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (this.mouseClicked) {
                this.spaceJustReleased = true;
                this.spacePressed = false;
            }
            this.mouseClicked = false;
        });

        window.addEventListener('mousemove', (e) => {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        // Touch pour mobile
        window.addEventListener('touchstart', (e) => {
            if (!this.spacePressed) {
                this.spaceJustPressed = true;
                this.spacePressed = true;
                this.spacePressTime = 0;
            }
            this.keys[' '] = true;
            e.preventDefault();
        });

        window.addEventListener('touchend', (e) => {
            this.spaceJustReleased = true;
            this.spacePressed = false;
            this.keys[' '] = false;
        });
    }

    update(deltaTime) {
        // Incrémente le temps d'appui
        if (this.spacePressed) {
            this.spacePressTime += deltaTime;
            if (this.spacePressTime > this.maxHoldTime) {
                this.spacePressTime = this.maxHoldTime;
            }
        }
    }

    isKeyPressed(key) {
        return this.keys[key] === true;
    }

    // Retourne true une seule fois au moment de l'appui
    wasJustPressed() {
        if (this.spaceJustPressed) {
            this.spaceJustPressed = false;
            return true;
        }
        return false;
    }

    // Retourne true une seule fois au moment du relâchement
    wasJustReleased() {
        if (this.spaceJustReleased) {
            this.spaceJustReleased = false;
            return true;
        }
        return false;
    }

    // Retourne true si maintenu
    isHeld() {
        return this.spacePressed;
    }

    // Retourne le temps d'appui (0 à maxHoldTime)
    getHoldTime() {
        return this.spacePressTime;
    }

    // Retourne le ratio de charge (0 à 1)
    getChargeRatio() {
        return Math.min(this.spacePressTime / this.maxHoldTime, 1);
    }

    reset() {
        this.spacePressed = false;
        this.spacePressTime = 0;
        this.spaceJustPressed = false;
        this.spaceJustReleased = false;
    }

    resetClick() {
        this.mouseClicked = false;
    }
}
