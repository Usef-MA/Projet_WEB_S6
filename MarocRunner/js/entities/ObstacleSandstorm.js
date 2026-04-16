import Entity from './Entity.js';

export default class ObstacleSandstorm extends Entity {
    constructor(x, speed) {
        super(x, 0, 120, 400);
        this.velocityX = -speed;
        this.particles = [];
        this.opacity = 0.7;
        
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * 120,
                y: Math.random() * 400,
                speed: 100 + Math.random() * 100,
                size: 2 + Math.random() * 4
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.particles.forEach(p => {
            p.y += p.speed * deltaTime;
            if (p.y > 400) {
                p.y = 0;
                p.x = Math.random() * 120;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = `rgba(194, 178, 128, ${this.opacity})`;
        ctx.fillRect(0, 0, 120, 400);
        
        ctx.fillStyle = '#d4af37';
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    collidesWith(entity) {
        const collision = (
            entity.x + entity.width > this.x &&
            entity.x < this.x + this.width &&
            entity.y + entity.height > this.y &&
            entity.y < this.y + this.height
        );
        
        if (collision) {
            entity.velocityY += 100;
        }
        
        return false;
    }
}
