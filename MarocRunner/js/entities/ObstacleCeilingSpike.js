import Entity from './Entity.js';

export default class ObstacleCeilingSpike extends Entity {
    constructor(x, speed) {
        super(x, 0, 60, 100);
        this.velocityX = -speed;
        this.pulseAnimation = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.pulseAnimation += 3 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#c0392b';
        
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y + 60);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + 40, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}
