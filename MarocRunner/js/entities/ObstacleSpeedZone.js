import Entity from './Entity.js';

export default class ObstacleSpeedZone extends Entity {
    constructor(x, speed, type = 'fast') {
        super(x, 0, 100, 400);
        this.velocityX = -speed;
        this.type = type;
        this.particles = [];
        this.animation = 0;
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                y: Math.random() * 400,
                offset: Math.random() * 100,
                speed: 200 + Math.random() * 200
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animation += 3 * deltaTime;
        
        this.particles.forEach(p => {
            if (this.type === 'fast') {
                p.offset += p.speed * deltaTime;
            } else {
                p.offset += p.speed * deltaTime * 0.3;
            }
            
            if (p.offset > 100) {
                p.offset = 0;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.type === 'fast') {
            const gradient = ctx.createLinearGradient(0, 0, 100, 0);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
            ctx.fillStyle = gradient;
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 100, 0);
            gradient.addColorStop(0, 'rgba(0, 100, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 100, 255, 0.3)');
            ctx.fillStyle = gradient;
        }
        
        ctx.fillRect(0, 0, 100, 400);
        
        ctx.strokeStyle = this.type === 'fast' ? '#ff0000' : '#0088ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 100, 400);
        
        this.particles.forEach(p => {
            ctx.fillStyle = this.type === 'fast' ? '#ff6600' : '#00aaff';
            ctx.fillRect(p.offset, p.y, 15, 3);
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
            if (this.type === 'fast') {
                entity.velocityX = 5;
            } else {
                entity.velocityX = -5;
            }
        }
        
        return false;
    }
}
