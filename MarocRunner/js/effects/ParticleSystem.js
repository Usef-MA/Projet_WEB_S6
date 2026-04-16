//  effets visuels
export class Particle {
    constructor(x, y, velocityX, velocityY, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        this.age += deltaTime;
        
        // Fade out progressif
        this.alpha = Math.max(0, 1 - (this.age / this.lifetime));
        
        // Rétrécissement
        this.size = Math.max(0, this.size * (1 - deltaTime * 2));
        
        return this.age < this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        // Étoile scintillante
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        
        ctx.restore();
    }
}

export default class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count = 3, color = '#d4af37') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed - 50; // Bias vers le haut
            const size = 2 + Math.random() * 3;
            const lifetime = 0.3 + Math.random() * 0.5;
            
            this.particles.push(new Particle(x, y, velocityX, velocityY, color, size, lifetime));
        }
    }

    update(deltaTime) {
        // Update et suppression des particules mortes
        this.particles = this.particles.filter(particle => particle.update(deltaTime));
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}