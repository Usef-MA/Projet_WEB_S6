import Entity from './Entity.js';

export default class ObstacleMovingWall extends Entity {
    constructor(x, speed) {
        super(x, 0, 60, 360);
        this.velocityX = -speed;
        this.gapY = 120;
        this.gapHeight = 110;
        this.oscillation = 0;
        this.oscillationSpeed = 2;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.oscillation += this.oscillationSpeed * deltaTime;
        this.gapY = 120 + Math.sin(this.oscillation) * 60;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, 0);
        
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, this.width, this.gapY);
        ctx.fillRect(0, this.gapY + this.gapHeight, this.width, 360 - (this.gapY + this.gapHeight));
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.width, this.gapY);
        ctx.strokeRect(0, this.gapY + this.gapHeight, this.width, 360 - (this.gapY + this.gapHeight));
        
        for (let i = 0; i < 3; i++) {
            const y1 = (this.gapY / 4) * (i + 1);
            const y2 = this.gapY + this.gapHeight + ((360 - (this.gapY + this.gapHeight)) / 4) * (i + 1);
            
            ctx.strokeStyle = '#95a5a6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, y1);
            ctx.lineTo(50, y1);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(10, y2);
            ctx.lineTo(50, y2);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(15, this.gapY + 10, 30, 10);
        ctx.fillRect(15, this.gapY + this.gapHeight - 20, 30, 10);
        
        ctx.restore();
    }

    collidesWith(entity) {
        //si le joueur est dans la zone horizontale du mur
        const playerInX = entity.x + entity.width > this.x && entity.x < this.x + this.width;
        
        if (!playerInX) return false;
        
        const playerTop = entity.y;
        const playerBottom = entity.y + entity.height;

        const gapTop = this.gapY;
        const gapBottom = this.gapY + this.gapHeight;
        
        // Le joueur EST dans le trou si son corps est entre gapTop et gapBottom
        const playerInGap = (playerTop >= gapTop && playerTop < gapBottom) || 
                            (playerBottom > gapTop && playerBottom <= gapBottom) ||
                            (playerTop <= gapTop && playerBottom >= gapBottom);
        
        // Si le joueur est dans le trou, pas de collision
        if (playerInGap) {
            return false;
        }
        
        // Sinon, collision avec le mur
        return true;
    }
    
}
