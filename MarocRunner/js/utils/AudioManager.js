// Gestionnaire audio centralisé
export default class AudioManager {
    constructor() {
        // Musique de fond
        this.backgroundMusic = new Audio('assets/background.mp3');
        this.backgroundMusic.loop = true; // Boucle infinie
        this.backgroundMusic.volume = 0.3; // Volume à 30%
        
        // Son de saut
        this.jumpSound = new Audio('assets/saut.mp3');
        this.jumpSound.volume = 0.5; // Volume à 50%
        
        // État
        this.isMusicPlaying = false;
        this.isMuted = false;
    }

    // Démarrer la musique de fond
    playBackgroundMusic() {
        if (!this.isMusicPlaying && !this.isMuted) {
            this.backgroundMusic.play().catch(err => {
                console.log('⚠️ Lecture auto bloquée (nécessite interaction utilisateur)');
            });
            this.isMusicPlaying = true;
            console.log('🎵 Musique de fond démarrée');
        }
    }

    // Arrêter la musique de fond
    stopBackgroundMusic() {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.isMusicPlaying = false;
        console.log('⏹️ Musique de fond arrêtée');
    }

    // Jouer le son de saut
    playJumpSound() {
        if (!this.isMuted) {
            // Réinitialiser le son pour permettre les sauts rapides
            this.jumpSound.currentTime = 0;
            this.jumpSound.play().catch(err => {
                console.log('⚠️ Erreur lecture son de saut:', err);
            });
        }
    }

    // Activer/désactiver le son
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.backgroundMusic.volume = 0;
            this.jumpSound.volume = 0;
            console.log('🔇 Son coupé');
        } else {
            this.backgroundMusic.volume = 0.3;
            this.jumpSound.volume = 0.5;
            console.log('🔊 Son activé');
        }
        
        return this.isMuted;
    }

    // Régler le volume de la musique (0 à 1)
    setMusicVolume(volume) {
        this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
    }

    // Régler le volume des effets sonores (0 à 1)
    setSoundVolume(volume) {
        this.jumpSound.volume = Math.max(0, Math.min(1, volume));
    }

    // Nettoyer les ressources
    dispose() {
        this.stopBackgroundMusic();
        this.backgroundMusic = null;
        this.jumpSound = null;
    }
}