// Variable d'état
let isMuted = false;

// Toggle Mute
window.toggleMute = function() {
    isMuted = !isMuted;
    
    const muteIcon = document.getElementById('mute-icon');
    const muteStatus = document.getElementById('mute-status');
    const muteBtn = document.getElementById('mute-toggle');
    
    if (isMuted) {
        muteIcon.textContent = '🔇';
        muteStatus.textContent = 'Désactivés';
        muteStatus.style.color = '#e74c3c';
        muteBtn.classList.add('muted');
    } else {
        muteIcon.textContent = '🔊';
        muteStatus.textContent = 'Activés';
        muteStatus.style.color = '#2ecc71';
        muteBtn.classList.remove('muted');
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('audioMuted', isMuted);
    console.log('🔊 Audio', isMuted ? 'désactivé' : 'activé');
};

// Charger les paramètres sauvegardés
function loadSettings() {
    const savedMute = localStorage.getItem('audioMuted');
    if (savedMute === 'true') {
        isMuted = false;
        toggleMute();
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', loadSettings);
