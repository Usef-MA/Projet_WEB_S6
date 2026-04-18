document.addEventListener("DOMContentLoaded", () => {
    const soundEnabled = document.getElementById("soundEnabled");
    const musicEnabled = document.getElementById("musicEnabled");
    const soundVolume = document.getElementById("soundVolume");
    const volumeValue = document.getElementById("volumeValue");
  
    AudioManager.init();
  
    soundEnabled.checked = AudioManager.isSoundEnabled();
    musicEnabled.checked = AudioManager.isMusicEnabled();
    soundVolume.value = Math.round(AudioManager.getVolume() * 100);
    volumeValue.textContent = `${soundVolume.value}%`;
  
    soundEnabled.addEventListener("change", () => {
      AudioManager.setSoundEnabled(soundEnabled.checked);
    });
  
    musicEnabled.addEventListener("change", () => {
      AudioManager.setMusicEnabled(musicEnabled.checked);
    });
  
    soundVolume.addEventListener("input", () => {
      const v = Number(soundVolume.value) / 100;
      AudioManager.setVolume(v);
      volumeValue.textContent = `${soundVolume.value}%`;
    });
  });