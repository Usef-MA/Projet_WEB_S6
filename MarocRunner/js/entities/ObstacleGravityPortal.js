import Entity from './Entity.js';

export default class ObstacleGravityPortal extends Entity {
    constructor(x, speed) {
        super(x, 150, 50, 100);
        this.velocityX = -speed;
        this.animation = 0;
        this.hasBeenActivated = false;
        this.isPowerUp = true;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animation += 3 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        const pulseScale = 1 + Math.sin(this.animation * 2) * 0.1;
        ctx.scale(pulseScale, pulseScale);
        
        const gradient = ctx.createRadialGradient(
            0, 0, 10,
            0, 0, 50
        );
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.9)');
        gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.6)');
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);
        
        for (let i = 0; i < 3; i++) {
            const angle = this.animation + (i * Math.PI * 2 / 3);
            const radius = 20 + Math.sin(this.animation * 3) * 5;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    collidesWith(entity) {
        const collision = (
            entity.x + entity.width > this.x &&
            entity.x < this.x + this.width &&
            entity.y + entity.height > this.y &&
            entity.y < this.y + this.height
        );

        if (collision && !this.hasBeenActivated) {
            this.activateEffect(entity);
            this.hasBeenActivated = true;
        }

        return false;
    }

    activateEffect(player) {
        player.activateShield();
        console.log('🛡️ Bouclier activé !');
    }

    // NOUVEAU : Le portail disparaît après activation
    isOffScreen(canvasWidth) {
        // Si activé, disparaît immédiatement
        if (this.hasBeenActivated) {
            return true;
        }
        // Sinon, comportement normal
        return this.x + this.width < 0;
    }
}
