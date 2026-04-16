import Entity from './Entity.js';

export default class ObstacleMirage extends Entity {
    constructor(x, y, speed) {
        super(x, y, 40, 40);
        this.velocityX = -speed;
        this.opacity = 1;
        this.lifetime = 3;
        this.age = 0;
        this.isFake = true;
        this.pulseAnimation = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.age += deltaTime;
        this.pulseAnimation += 4 * deltaTime;
        
        if (this.age > this.lifetime * 0.7) {
            this.opacity = 1 - ((this.age - this.lifetime * 0.7) / (this.lifetime * 0.3));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.globalAlpha = this.opacity * (0.7 + Math.sin(this.pulseAnimation) * 0.3);
        
        const scale = 1 + Math.sin(this.pulseAnimation) * 0.1;
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.setLineDash([]);
        
        ctx.restore();
    }

    collidesWith(entity) {
        return false;
    }

    isOffScreen(canvasWidth) {
        return this.x + this.width < 0 || this.age > this.lifetime;
    }
}
