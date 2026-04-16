import Entity from './Entity.js';

export default class ObstacleRotatingSword extends Entity {
    constructor(x, y, speed) {
        super(x, y, 80, 80);
        this.velocityX = -speed;
        this.rotation = 0;
        this.rotationSpeed = 5;
        this.radius = 35;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.rotation += this.rotationSpeed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + 40, this.y + 40);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-5, -this.radius, 10, this.radius * 2);
        
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    collidesWith(entity) {
        const dx = (this.x + 40) - (entity.x + entity.width / 2);
        const dy = (this.y + 40) - (entity.y + entity.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + 20);
    }
}
