// dessin en 0,0 + positionnement avec translate()
export default class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.color = '#ffffff';
    }

    update(deltaTime) {
        // Mise à jour de la position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        
        // On se déplace à la position de l'entité
        ctx.translate(this.x, this.y);
        
        // Dessin de base (sera surchargé par les classes filles)
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.restore();
    }

    // Partie Collision 
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    isOffScreen(canvasWidth) {
        return this.x + this.width < 0;
    }
}