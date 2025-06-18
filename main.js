// Piano configuration
const pianoKeys = [
  { note: 'C4', key: 'A', frequency: 261.63, isBlack: false },
  { note: 'C#4', key: 'W', frequency: 277.18, isBlack: true },
  { note: 'D4', key: 'S', frequency: 293.66, isBlack: false },
  { note: 'D#4', key: 'E', frequency: 311.13, isBlack: true },
  { note: 'E4', key: 'D', frequency: 329.63, isBlack: false },
  { note: 'F4', key: 'F', frequency: 349.23, isBlack: false },
  { note: 'F#4', key: 'T', frequency: 369.99, isBlack: true },
  { note: 'G4', key: 'G', frequency: 392.00, isBlack: false },
  { note: 'G#4', key: 'Y', frequency: 415.30, isBlack: true },
  { note: 'A4', key: 'H', frequency: 440.00, isBlack: false },
  { note: 'A#4', key: 'U', frequency: 466.16, isBlack: true },
  { note: 'B4', key: 'J', frequency: 493.88, isBlack: false },
  { note: 'C5', key: 'K', frequency: 523.25, isBlack: false },
  { note: 'C#5', key: 'O', frequency: 554.37, isBlack: true },
  { note: 'D5', key: 'L', frequency: 587.33, isBlack: false },
  { note: 'D#5', key: ';', frequency: 622.25, isBlack: true },
  { note: 'E5', key: "'", frequency: 659.25, isBlack: false }
];

// Web Audio API setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const activeOscillators = new Map();

// Create piano keys
function createPianoKeys() {
  const piano = document.getElementById('piano');
  let whiteKeyIndex = 0;
  
  pianoKeys.forEach((keyData, index) => {
    if (keyData.isBlack) {
      // Create black key
      const blackKey = document.createElement('div');
      blackKey.className = 'black-key';
      blackKey.id = keyData.note;
      blackKey.dataset.key = keyData.key;
      blackKey.dataset.frequency = keyData.frequency;
      
      // Position black key (between white keys)
      const leftPosition = (whiteKeyIndex * 62) - 20; // 62px per white key, centered
      blackKey.style.left = `${leftPosition}px`;
      
      blackKey.innerHTML = `
        <div class="key-label">${keyData.key}</div>
        <div class="note-label">${keyData.note}</div>
      `;
      
      // Add event listeners
      addKeyEventListeners(blackKey, keyData);
      
      piano.appendChild(blackKey);
    } else {
      // Create white key
      const whiteKey = document.createElement('div');
      whiteKey.className = 'white-key';
      whiteKey.id = keyData.note;
      whiteKey.dataset.key = keyData.key;
      whiteKey.dataset.frequency = keyData.frequency;
      
      whiteKey.innerHTML = `
        <div class="key-label">${keyData.key}</div>
        <div class="note-label">${keyData.note}</div>
      `;
      
      // Add event listeners
      addKeyEventListeners(whiteKey, keyData);
      
      piano.appendChild(whiteKey);
      whiteKeyIndex++;
    }
  });
}

// Add event listeners to piano keys
function addKeyEventListeners(keyElement, keyData) {
  // Mouse events
  keyElement.addEventListener('mousedown', () => playNote(keyData.note, keyData.frequency));
  keyElement.addEventListener('mouseup', () => stopNote(keyData.note));
  keyElement.addEventListener('mouseleave', () => stopNote(keyData.note));
  
  // Touch events for mobile
  keyElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    playNote(keyData.note, keyData.frequency);
  });
  keyElement.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopNote(keyData.note);
  });
}

// Play a note
function playNote(note, frequency) {
  // Stop any existing oscillator for this note
  stopNote(note);
  
  // Create oscillator
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Configure oscillator
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  // Configure gain (volume envelope)
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Start oscillator
  oscillator.start();
  
  // Store oscillator reference
  activeOscillators.set(note, { oscillator, gainNode });
  
  // Visual feedback
  const keyElement = document.getElementById(note);
  if (keyElement) {
    keyElement.classList.add('pressed');
  }
}

// Stop a note
function stopNote(note) {
  const oscillatorData = activeOscillators.get(note);
  if (oscillatorData) {
    // Fade out
    oscillatorData.gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    // Stop oscillator after fade
    setTimeout(() => {
      oscillatorData.oscillator.stop();
      activeOscillators.delete(note);
    }, 100);
  }
  
  // Remove visual feedback
  const keyElement = document.getElementById(note);
  if (keyElement) {
    keyElement.classList.remove('pressed');
  }
}

// Computer keyboard controls
function handleKeyDown(event) {
  const key = event.key.toUpperCase();
  const keyData = pianoKeys.find(k => k.key === key);
  
  if (keyData && !event.repeat) {
    playNote(keyData.note, keyData.frequency);
  }
}

function handleKeyUp(event) {
  const key = event.key.toUpperCase();
  const keyData = pianoKeys.find(k => k.key === key);
  
  if (keyData) {
    stopNote(keyData.note);
  }
}

// Initialize piano
document.addEventListener('DOMContentLoaded', () => {
  createPianoKeys();
  
  // Add keyboard event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Resume audio context on first interaction
  document.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, { once: true });
  
  // Instructions for audio context
  console.log('Click anywhere to start audio context');
});
