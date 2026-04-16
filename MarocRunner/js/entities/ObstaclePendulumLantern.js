import Entity from './Entity.js';

export default class ObstaclePendulumLantern extends Entity {
    constructor(x, speed) {
        super(x, 0, 30, 150);
        this.velocityX = -speed;
        this.angle = Math.PI / 10; 
        this.angleSpeed = 1.5;
        this.swingDirection = 1;
        this.ropeLength = 100;
        this.maxAngle = Math.PI / 8; 
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.angle += this.angleSpeed * this.swingDirection * deltaTime;
        
        if (this.angle > this.maxAngle) {
            this.angle = this.maxAngle;
            this.swingDirection = -1;
        } else if (this.angle < -this.maxAngle) {
            this.angle = -this.maxAngle;
            this.swingDirection = 1;
        }
    }

    draw(ctx) {
        ctx.save();
        
        const pivotX = this.x + 15;
        const pivotY = 20;
        const lanternX = pivotX + Math.sin(this.angle) * this.ropeLength;
        const lanternY = pivotY + Math.cos(this.angle) * this.ropeLength;
        
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(lanternX, lanternY);
        ctx.stroke();
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(lanternX - 15, lanternY - 10, 30, 40);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(lanternX - 15, lanternY - 10, 30, 40);
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(lanternX, lanternY + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        this.x = lanternX - 15;
        this.y = lanternY - 10;
        this.width = 30;
        this.height = 40;
    }
}
