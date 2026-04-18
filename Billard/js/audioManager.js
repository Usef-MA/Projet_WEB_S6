"use strict";

const AudioManager = (() => {
  const STORAGE_KEYS = {
    soundEnabled: "billard_sound_enabled",
    musicEnabled: "billard_music_enabled",
    volume: "billard_audio_volume"
  };

  const sounds = {
    shoot: new Audio("assets/audio/shoot.mp3"),
    hit: new Audio("assets/audio/hit.mp3"),
    pocket: new Audio("assets/audio/pocket.mp3"),
    music: new Audio("assets/audio/jazz-loop.mp3")
  };

  let soundEnabled = true;
  let musicEnabled = true;
  let volume = 0.5;

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function loadSettings() {
    const ss = localStorage.getItem(STORAGE_KEYS.soundEnabled);
    const ms = localStorage.getItem(STORAGE_KEYS.musicEnabled);
    const vol = localStorage.getItem(STORAGE_KEYS.volume);

    if (ss !== null) soundEnabled = ss === "1";
    if (ms !== null) musicEnabled = ms === "1";
    if (vol !== null) volume = clamp01(Number(vol) / 100);
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.soundEnabled, soundEnabled ? "1" : "0");
    localStorage.setItem(STORAGE_KEYS.musicEnabled, musicEnabled ? "1" : "0");
    localStorage.setItem(STORAGE_KEYS.volume, String(Math.round(volume * 100)));
  }

  function applyVolume() {
    sounds.shoot.volume = soundEnabled ? volume : 0;
    sounds.hit.volume = soundEnabled ? volume * 0.7 : 0;
    sounds.pocket.volume = soundEnabled ? volume : 0;
    sounds.music.volume = musicEnabled ? volume * 0.35 : 0;
  }

  function init() {
    loadSettings();
    sounds.music.loop = true;
    applyVolume();
  }

  function setSoundEnabled(value) {
    soundEnabled = !!value;
    applyVolume();
    saveSettings();
  }

  function setMusicEnabled(value) {
    musicEnabled = !!value;
    applyVolume();
    saveSettings();

    if (musicEnabled) {
      playMusic();
    } else {
      stopMusic();
    }
  }

  function setVolume(value) {
    volume = clamp01(value);
    applyVolume();
    saveSettings();
  }

  function play(name) {
    if (!soundEnabled) return;
    if (name === "music") return;
    const audio = sounds[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function playMusic() {
    if (!musicEnabled) return;
    sounds.music.play().catch(() => {});
  }

  function stopMusic() {
    sounds.music.pause();
    sounds.music.currentTime = 0;
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  function isMusicEnabled() {
    return musicEnabled;
  }

  function getVolume() {
    return volume;
  }

  return {
    init,
    play,
    playMusic,
    stopMusic,
    setSoundEnabled,
    setMusicEnabled,
    setVolume,
    isSoundEnabled,
    isMusicEnabled,
    getVolume
  };
})();