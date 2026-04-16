import Entity from './Entity.js';

export default class ObstacleInvertedSpike extends Entity {
    constructor(x, speed) {
        super(x, 0, 40, 80);
        this.velocityX = -speed;
        this.waveOffset = Math.random() * Math.PI * 2;
        this.pulseAnimation = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.waveOffset += 2 * deltaTime;
        this.pulseAnimation += 3 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y);
        
        const scale = 1 + Math.sin(this.pulseAnimation) * 0.05;
        ctx.scale(scale, 1);
        
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        for (let i = 0; i < 3; i++) {
            const y = 20 + i * 20;
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-10, y);
            ctx.lineTo(10, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
