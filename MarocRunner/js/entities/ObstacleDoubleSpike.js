import Entity from './Entity.js';

export default class ObstacleDoubleSpike extends Entity {
    constructor(x, y, speed) {
        super(x, y, 40, 80);
        this.velocityX = -speed;
        this.pulseAnimation = 0;
        this.pulseSpeed = 4;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.pulseAnimation += this.pulseSpeed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        const scale = 1 + Math.sin(this.pulseAnimation) * 0.05;
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#5B8C5A'; // Vert cactus
        ctx.fillRect(-15, -30, 30, 60);
        
        // Bras gauche
        ctx.fillRect(-25, -15, 15, 8);
        ctx.fillRect(-25, -15, 8, 25);
        
        // Bras droit
        ctx.fillRect(10, -5, 15, 8);
        ctx.fillRect(17, -5, 8, 20);
        
        // Contours du tronc
        ctx.strokeStyle = '#4A7C49';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -30, 30, 60);
        
        // Contours bras gauche
        ctx.strokeRect(-25, -15, 15, 8);
        ctx.strokeRect(-25, -15, 8, 25);
        
        // Contours bras droit
        ctx.strokeRect(10, -5, 15, 8);
        ctx.strokeRect(17, -5, 8, 20);
        
        // Épines (petites lignes)
        ctx.strokeStyle = '#3D5C3D';
        ctx.lineWidth = 2;
        
        // Épines sur le tronc
        for (let i = -25; i < 25; i += 10) {
            // Gauche
            ctx.beginPath();
            ctx.moveTo(-15, i);
            ctx.lineTo(-18, i);
            ctx.stroke();
            
            // Droite
            ctx.beginPath();
            ctx.moveTo(15, i);
            ctx.lineTo(18, i);
            ctx.stroke();
        }
        
        // Épines sur bras gauche
        ctx.beginPath();
        ctx.moveTo(-25, -11);
        ctx.lineTo(-28, -11);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-21, 5);
        ctx.lineTo(-21, 8);
        ctx.stroke();
        
        // Épines sur bras droit
        ctx.beginPath();
        ctx.moveTo(25, -1);
        ctx.lineTo(28, -1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(21, 10);
        ctx.lineTo(21, 13);
        ctx.stroke();
        
        // Fleur sur le dessus (optionnel)
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(0, -35, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
