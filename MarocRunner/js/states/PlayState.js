import Obstacle from '../entities/Obstacle.js';
import ObstacleFlying from '../entities/ObstacleFlying.js';
import Player from '../entities/Player.js';
import GameState from './GameState.js';

import ObstacleCeilingSpike from '../entities/ObstacleCeilingSpike.js';
import ObstacleDoubleSpike from '../entities/ObstacleDoubleSpike.js';
import ObstacleFlyingCarpet from '../entities/ObstacleFlyingCarpet.js';

import ObstacleInvertedSpike from '../entities/ObstacleInvertedSpike.js';
import ObstaclePendulumLantern from '../entities/ObstaclePendulumLantern.js';
import ObstacleRotatingSword from '../entities/ObstacleRotatingSword.js';

import ObstacleGravityPortal from '../entities/ObstacleGravityPortal.js';
import ObstacleMovingWall from '../entities/ObstacleMovingWall.js';

import ObstacleMirage from '../entities/ObstacleMirage.js';
import ObstacleSandstorm from '../entities/ObstacleSandstorm.js';
import ObstacleSpeedZone from '../entities/ObstacleSpeedZone.js';

import LevelConfig from '../config/LevelConfig.js';

export default class PlayState extends GameState {
    constructor(game) {
        super(game);
        
        this.player = null;
        this.obstacles = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.baseSpeed = 280;
        this.currentSpeed = this.baseSpeed;
        
        this.timeSinceLastObstacle = 0;
        this.minSpawnDelay = 1.2;
        this.maxSpawnDelay = 2.2;
        this.nextSpawnDelay = this.getRandomSpawnDelay();
        
        this.backgroundSpeed = 120;
        this.distanceTraveled = 0;
        this.pointsPerMeter = 1;
    
        this.backgroundImages = {
            1: new Image(),
            2: new Image(),
            3: new Image(),
            4: new Image(),
            5: new Image()
        };
        
        this.backgroundImages[1].src = 'assets/level1-bg.png';
        this.backgroundImages[2].src = 'assets/level2-bg.png';
        this.backgroundImages[3].src = 'assets/level3-bg.png';
        this.backgroundImages[4].src = 'assets/level4-bg.png';
        this.backgroundImages[5].src = 'assets/level5-bg.png';
        
        this.backgroundsLoaded = {
            1: false,
            2: false,
            3: false,
            4: false,
            5: false
        };
        
        Object.keys(this.backgroundImages).forEach(level => {
            this.backgroundImages[level].onload = () => {
                this.backgroundsLoaded[level] = true;
                console.log(`✅ Level ${level} background chargé`);
            };
        });
        
        this.backgroundX1 = 0;
        this.backgroundX2 = 800;

        this.isLevelTransition = false;
        this.transitionTimer = 0;
        this.transitionDuration = 2.5;
        this.nextLevel = 1;
        
        this.backgroundTransitionProgress = 0;
        this.backgroundTransitioning = false;
        this.backgroundTransitionDuration = 1.5;
        this.previousLevel = 1;

        // ✅ Création initiale avec audioManager
        this.player = new Player(100, 320, game.audioManager);
    }

    enter() {
        console.log('Play State activé - Niveau', this.level);
        this.reset();
    }

    reset() {
        // ✅ CORRECTION ICI : Passer game.audioManager lors du reset
        this.player = new Player(100, 320, this.game.audioManager);
        this.obstacles = [];
        
        this.game.scoreManager.reset();
        this.score = 0;
        this.lives = 3;
        
        const config = LevelConfig.getConfig(this.level);
        this.currentSpeed = config.speed;
        
        this.backgroundX1 = 0;
        this.backgroundX2 = 800;
        this.distanceTraveled = 0;
        
        this.timeSinceLastObstacle = 0;
        this.nextSpawnDelay = this.getRandomSpawnDelay();
    }

    getRandomSpawnDelay() {
        const config = LevelConfig.getConfig(this.level);
        return config.spawnDelayMin + Math.random() * (config.spawnDelayMax - config.spawnDelayMin);
    }

    update(deltaTime) {
        const isMuted = localStorage.getItem('audioMuted') === 'true';
    
        if (isMuted) {
            this.game.audioManager.stopBackgroundMusic();
            this.game.audioManager.isMuted = true;
        } else if (!this.game.audioManager.isMusicPlaying) {
            this.game.audioManager.playBackgroundMusic();
        }

        if (!this.player) return;

        this.game.inputManager.update(deltaTime);
        
        if (this.isLevelTransition) {
            this.transitionTimer += deltaTime;
            
            if (this.transitionTimer >= this.transitionDuration) {
                this.isLevelTransition = false;
                this.level = this.nextLevel;
                this.transitionTimer = 0;
                
                const config = LevelConfig.getConfig(this.level);
                this.currentSpeed = config.speed;
                
                console.log('Niveau', this.level, 'activé !');
            }
            
            this.player.update(deltaTime);
            this.obstacles.forEach(obstacle => {
                obstacle.velocityX = -this.currentSpeed;
                obstacle.update(deltaTime);
            });
            
            this.backgroundX1 -= this.backgroundSpeed * deltaTime;
            this.backgroundX2 -= this.backgroundSpeed * deltaTime;
            
            if (this.backgroundX1 <= -800) this.backgroundX1 = 800;
            if (this.backgroundX2 <= -800) this.backgroundX2 = 800;
            
            return;
        }

        this.player.update(deltaTime);

        this.obstacles.forEach(obstacle => {
            obstacle.velocityX = -this.currentSpeed;
            obstacle.update(deltaTime);
        });

        this.timeSinceLastObstacle += deltaTime;
        if (this.timeSinceLastObstacle >= this.nextSpawnDelay) {
            this.spawnObstacle();
            this.timeSinceLastObstacle = 0;
            this.nextSpawnDelay = this.getRandomSpawnDelay();
        }

        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.isOffScreen(800)) {
                this.addScore(50);
                return false;
            }
            return true;
        });

        this.checkCollisions();

        this.backgroundX1 -= this.backgroundSpeed * deltaTime;
        this.backgroundX2 -= this.backgroundSpeed * deltaTime;
        
        if (this.backgroundX1 <= -800) this.backgroundX1 = 800;
        if (this.backgroundX2 <= -800) this.backgroundX2 = 800;

        this.distanceTraveled += this.currentSpeed * deltaTime;
        this.addScore(this.currentSpeed * deltaTime * 0.05);

        this.currentSpeed += deltaTime * 3;

        const newLevel = LevelConfig.getLevelByScore(this.score);
        
        if (newLevel > this.level && newLevel <= 5) {
            this.levelUp(newLevel);
        }

        if (this.lives <= 0 && !this.player.isDead) {
            this.player.die();
            setTimeout(() => {
                this.game.changeState('gameover');
            }, 1000);
        }
    }

    draw(ctx) {
        const canvas = ctx.canvas;

        if (this.backgroundTransitioning) {
            this.backgroundTransitionProgress += 0.016 / this.backgroundTransitionDuration;
            if (this.backgroundTransitionProgress >= 1) {
                this.backgroundTransitioning = false;
                this.backgroundTransitionProgress = 0;
            }
        }

        const currentLevel = this.isLevelTransition ? this.previousLevel : this.level;
        const currentBg = this.backgroundImages[currentLevel];
        const currentBgLoaded = this.backgroundsLoaded[currentLevel];
        
        if (currentBgLoaded && currentBg) {
            ctx.drawImage(currentBg, this.backgroundX1, 0, 800, 400);
            ctx.drawImage(currentBg, this.backgroundX2, 0, 800, 400);
            
            if (this.backgroundTransitioning && this.nextLevel <= 5) {
                const nextBg = this.backgroundImages[this.nextLevel];
                const nextBgLoaded = this.backgroundsLoaded[this.nextLevel];
                
                if (nextBgLoaded && nextBg) {
                    ctx.save();
                    ctx.globalAlpha = this.backgroundTransitionProgress;
                    ctx.drawImage(nextBg, this.backgroundX1, 0, 800, 400);
                    ctx.drawImage(nextBg, this.backgroundX2, 0, 800, 400);
                    ctx.restore();
                }
            }
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            
            if (currentLevel === 1) {
                gradient.addColorStop(0, '#4a1a4a');
                gradient.addColorStop(0.5, '#2d1b3d');
                gradient.addColorStop(1, '#8b6f47');
            } else if (currentLevel === 2) {
                gradient.addColorStop(0, '#2d1b5e');
                gradient.addColorStop(0.5, '#5a3d7a');
                gradient.addColorStop(1, '#d4691a');
            } else if (currentLevel === 3) {
                gradient.addColorStop(0, '#8b1a1a');
                gradient.addColorStop(0.5, '#2a0a2a');
                gradient.addColorStop(1, '#d4691a');
            } else if (currentLevel === 4) {
                gradient.addColorStop(0, '#1a1a4a');
                gradient.addColorStop(0.5, '#4a1a8b');
                gradient.addColorStop(1, '#8b4a1a');
            } else {
                gradient.addColorStop(0, '#2a1a0a');
                gradient.addColorStop(0.5, '#8b4a1a');
                gradient.addColorStop(1, '#d4691a');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.drawScrollingBackground(ctx);
        }

        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, 360, canvas.width, 40);
        
        ctx.strokeStyle = '#6b5437';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const x = (this.backgroundX1 % 100) + i * 100;
            ctx.beginPath();
            ctx.moveTo(x, 365);
            ctx.lineTo(x + 50, 365);
            ctx.stroke();
        }

        this.obstacles.forEach(obstacle => obstacle.draw(ctx));
        if (this.player) {
            this.player.draw(ctx);
        }

        this.drawHUD(ctx);
        
        if (this.isLevelTransition) {
            this.drawLevelTransition(ctx);
        }
    }

    drawScrollingBackground(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
        
        for (let i = -1; i < 6; i++) {
            const x = (this.backgroundX1 * 0.5 % 200) + i * 200;
            this.drawStar(ctx, x, 100, 15);
            this.drawStar(ctx, x + 100, 200, 12);
        }
        
        ctx.restore();
    }

    drawStar(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? size : size / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawHUD(ctx) {
        const canvas = ctx.canvas;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, 50);

        ctx.save();
        ctx.font = 'bold 24px "Exo 2", Arial';
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 32);
        
        ctx.textAlign = 'center';
        
        const config = LevelConfig.getConfig(this.level);
        ctx.fillStyle = this.level >= 4 ? '#ff0000' : '#d4af37';
        ctx.font = this.level >= 4 ? 'bold 26px "Exo 2", Arial' : 'bold 24px "Exo 2", Arial';
        ctx.fillText(this.level === 5 ? '🌪️ TEMPÊTE 🌪️' : `Niveau ${this.level}`, canvas.width / 2, 32);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 24px "Exo 2", Arial';
        ctx.fillText(`❤️ × ${this.lives}`, canvas.width - 20, 32);
        
        ctx.restore();
    }

    spawnObstacle() {
        const x = 800 + 50;
        const config = LevelConfig.getConfig(this.level);
        const obstacleTypes = config.obstacles;
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obstacle;
        
        switch(randomType) {
            case 'spike':
                obstacle = new Obstacle(x, 300, this.currentSpeed);
                break;
            case 'lowBlock':
                obstacle = new ObstacleFlying(x, 280, this.currentSpeed);
                break;
            case 'doubleSpike':
                obstacle = new ObstacleDoubleSpike(x, 300, this.currentSpeed);
                break;
            case 'ceilingSpike':
                obstacle = new ObstacleCeilingSpike(x, this.currentSpeed);
                break;
            case 'flyingCarpet':
                obstacle = new ObstacleFlyingCarpet(x, this.currentSpeed);
                break;
            case 'rotatingSword':
                obstacle = new ObstacleRotatingSword(x, 200, this.currentSpeed);
                break;
            case 'pendulumLantern':
                obstacle = new ObstaclePendulumLantern(x, this.currentSpeed);
                break;
            case 'invertedSpike':
                obstacle = new ObstacleInvertedSpike(x, this.currentSpeed);
                break;
            case 'gravityPortal':
                obstacle = new ObstacleGravityPortal(x, this.currentSpeed);
                break;
            case 'movingWall':
                obstacle = new ObstacleMovingWall(x, this.currentSpeed);
                break;
            case 'sandstorm':
                obstacle = new ObstacleSandstorm(x, this.currentSpeed);
                break;
            case 'mirage':
                obstacle = new ObstacleMirage(x, 300, this.currentSpeed);
                break;
            case 'speedZone':
                const type = Math.random() > 0.5 ? 'fast' : 'slow';
                obstacle = new ObstacleSpeedZone(x, this.currentSpeed, type);
                break;
            default:
                obstacle = new Obstacle(x, 300, this.currentSpeed);
        }
        
        this.obstacles.push(obstacle);
    }

    checkCollisions() {
        if (!this.player || this.player.isDead) return;
    
        this.obstacles.forEach(obstacle => {
            // Check si c'est un power-up
            if (obstacle.isPowerUp) {
                obstacle.collidesWith(this.player);
                return; 
            }

            if (obstacle.collidesWith(this.player)) {
                this.hitObstacle(obstacle);
            }
        });
    }
    
    

    hitObstacle(obstacle) {
        if (this.player.breakShield()) {
            // Le bouclier a protégé, on retire l'obstacle
            const index = this.obstacles.indexOf(obstacle);
            if (index > -1) {
                this.obstacles.splice(index, 1);
            }
            
            // Flash bleu au lieu de rouge
            this.flashScreen('rgba(0, 200, 255, 0.5)');
            console.log('🛡️ Bouclier brisé ! Pas de dégâts');
            return; 
        }
        
        // Pas de bouclier, dégâts normaux
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }
    
        this.lives--;
        this.flashScreen('rgba(255, 0, 0, 0.3)');
    
        console.log('💥 Collision ! Vies restantes:', this.lives);
    }
    

    flashScreen(color = 'rgba(255, 0, 0, 0.3)') {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    

    addScore(points) {
        this.score += points;
        this.game.scoreManager.addPoints(points);
    }

    levelUp(newLevel) {
        console.log('🎉 Transition vers niveau', newLevel, '!');
        
        this.isLevelTransition = true;
        this.transitionTimer = 0;
        this.nextLevel = newLevel;
        this.previousLevel = this.level;
        
        this.backgroundTransitioning = true;
        this.backgroundTransitionProgress = 0;
        
        if (newLevel % 2 === 0 && this.lives < 5) {
            this.lives++;
            console.log('❤️ Vie bonus !');
        }
    }

    handleInput(inputManager) {
        if (!this.player || this.player.isDead) return;
    
        // Détecte l'appui initial
        if (inputManager.wasJustPressed()) {
            this.player.startCharging();
        }
    
        // Détecte le relâchement
        if (inputManager.wasJustReleased()) {
            const holdTime = inputManager.getHoldTime();
            
            // Si appui court (< 150ms), saut normal
            if (holdTime < 0.15) {
                this.player.jump();
            } else {
                // Sinon, saut chargé selon le temps
                const chargeRatio = inputManager.getChargeRatio();
                this.player.chargedJump(chargeRatio);
            }
            
            inputManager.reset();
        }
    
        if (inputManager.isKeyPressed('Escape')) {
            console.log('Pause non implémentée');
        }
    }

    exit() {
        console.log('🚪 Sortie du Play State');
    }

    drawLevelTransition(ctx) {
        const canvas = ctx.canvas;
        const progress = this.transitionTimer / this.transitionDuration;
        
        ctx.save();
        
        let alpha;
        if (progress < 0.3) {
            alpha = progress / 0.3;
        } else if (progress > 0.7) {
            alpha = (1 - progress) / 0.3;
        } else {
            alpha = 1;
        }
        
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        
        ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
        ctx.shadowBlur = 20;
        
        const config = LevelConfig.getConfig(this.nextLevel);
        ctx.fillStyle = this.nextLevel >= 4 ? '#ff0000' : '#d4af37';
        ctx.font = 'bold 72px "Exo 2", Arial';
        
        if (this.nextLevel >= 4) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        }
        
        ctx.fillText(config.name, 0, -30);
        
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Exo 2", Arial';
        
        const messages = {
            2: 'Obstacles volants !',
            3: 'Ça chauffe !',
            4: '💀 SURVIE 💀',
            5: '🌪️ CHAOS TOTAL 🌪️'
        };
        
        ctx.fillText(messages[this.nextLevel] || '', 0, 30);
        
        ctx.restore();
        ctx.restore();
    }
}