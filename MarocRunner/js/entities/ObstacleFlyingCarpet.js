import Entity from './Entity.js';

export default class ObstacleFlyingCarpet extends Entity {
    constructor(x, speed) {
        super(x, 150, 60, 20);
        this.velocityX = -speed;
        this.oscillation = Math.random() * Math.PI * 2;
        this.oscillationSpeed = 3;
        this.baseY = 150 + Math.random() * 100;
        this.amplitude = 40;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.oscillation += this.oscillationSpeed * deltaTime;
        this.y = this.baseY + Math.sin(this.oscillation) * this.amplitude;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(0, 0, 60, 20);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 60, 20);
        
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(10 + i * 20, 10, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12';
            ctx.fill();
        }
        
        ctx.restore();
    }
}
