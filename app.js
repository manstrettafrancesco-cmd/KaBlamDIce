'use strict';

const IMAGE_COUNT = 8;
const ROLL_DURATION = 780;

const home = document.getElementById('home');
const resultView = document.getElementById('resultView');
const rollButton = document.getElementById('rollButton');
const rollLabel = document.getElementById('rollLabel');
const rerollButton = document.getElementById('rerollButton');
const closeButton = document.getElementById('closeButton');
const die = document.getElementById('die');
const resultNumber = document.getElementById('resultNumber');
const resultImage = document.getElementById('resultImage');
const imageLoader = document.getElementById('imageLoader');
const flash = document.getElementById('flash');

let rolling = false;
let audioContext = null;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioContext = new AudioCtx();
  }
  if (audioContext?.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(ctx, frequency, start, duration, type = 'sine', gain = 0.12, endFrequency = null) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start); osc.stop(start + duration + 0.02);
}

function noise(ctx, start, duration, gain = 0.12, lowpass = 1200) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  src.buffer = buffer;
  filter.type = 'lowpass'; filter.frequency.value = lowpass;
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(amp).connect(ctx.destination);
  src.start(start); src.stop(start + duration);
}

function playDiceRoll() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [0, .09, .18, .29, .41, .54].forEach((offset, i) => {
    noise(ctx, now + offset, .075, .10 - i * .008, 800 + i * 130);
    tone(ctx, 130 + i * 18, now + offset, .055, 'square', .035);
  });
}

function playResultSound(result) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  switch (result) {
    case 1:
      noise(ctx, t, .62, .34, 700); tone(ctx, 170, t, .62, 'sawtooth', .14, 45); break;
    case 2:
      tone(ctx, 270, t, .20, 'sawtooth', .11, 120); tone(ctx, 190, t+.18, .32, 'square', .08, 70); break;
    case 3:
      tone(ctx, 240, t, .18, 'triangle', .10, 185); tone(ctx, 180, t+.2, .24, 'triangle', .09, 130); break;
    case 4:
      tone(ctx, 260, t, .14, 'square', .07); break;
    case 5:
      tone(ctx, 330, t, .10, 'sine', .08); tone(ctx, 392, t+.11, .10, 'sine', .07); break;
    case 6:
      tone(ctx, 392, t, .11, 'triangle', .08); tone(ctx, 494, t+.10, .14, 'triangle', .08); break;
    case 7:
      noise(ctx, t, .10, .18, 1500); tone(ctx, 520, t+.03, .18, 'square', .06, 310); break;
    case 8:
      tone(ctx, 440, t, .11, 'triangle', .08); tone(ctx, 554, t+.09, .11, 'triangle', .08); tone(ctx, 659, t+.18, .18, 'triangle', .09); break;
    case 9:
      [523,659,784,1046].forEach((f,i)=>tone(ctx,f,t+i*.08,.22,'sine',.07)); break;
    case 10:
      noise(ctx, t, .75, .38, 1200); tone(ctx, 90, t, .75, 'sawtooth', .16, 38);
      [523,659,784,1046].forEach((f,i)=>tone(ctx,f,t+.22+i*.07,.42,'triangle',.065)); break;
  }
}

function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function showFlash() {
  flash.classList.remove('go');
  void flash.offsetWidth;
  flash.classList.add('go');
}

function imagePath(result, imageNumber) {
  return `assets/images/${result}/${String(imageNumber).padStart(2, '0')}.png`;
}

function showResult(result, imageNumber) {
  resultNumber.textContent = String(result);
  resultImage.classList.remove('loaded');
  imageLoader.classList.remove('hidden');
  resultImage.src = imagePath(result, imageNumber);
  resultImage.alt = `Ka-Blam: risultato ${result}, vignetta ${imageNumber}`;
  resultView.hidden = false;
  resultView.classList.remove('enter');
  void resultView.offsetWidth;
  resultView.classList.add('enter');
  home.setAttribute('aria-hidden', 'true');
  if (result === 1 || result === 10) showFlash();
}

resultImage.addEventListener('load', () => {
  imageLoader.classList.add('hidden');
  requestAnimationFrame(() => resultImage.classList.add('loaded'));
});
resultImage.addEventListener('error', () => {
  imageLoader.textContent = 'IMMAGINE NON TROVATA';
});

async function roll() {
  if (rolling) return;
  rolling = true;
  getAudioContext();
  playDiceRoll();
  vibrate(35);
  die.classList.remove('rolling');
  void die.offsetWidth;
  die.classList.add('rolling');

  const result = randomInt(1, 10);
  const imageNumber = randomInt(1, IMAGE_COUNT);
  const preload = new Image();
  preload.src = imagePath(result, imageNumber);

  await new Promise(resolve => setTimeout(resolve, ROLL_DURATION));
  vibrate(result === 1 || result === 10 ? [60, 40, 90] : 45);
  showResult(result, imageNumber);
  playResultSound(result);
  rolling = false;
}

function closeResult() {
  resultView.hidden = true;
  resultImage.src = '';
  home.removeAttribute('aria-hidden');
}

rollButton.addEventListener('click', roll);
rollLabel.addEventListener('click', roll);
rerollButton.addEventListener('click', () => { closeResult(); setTimeout(roll, 60); });
closeButton.addEventListener('click', closeResult);

// Impedisce doppio tap/zoom accidentale durante il gioco.
document.addEventListener('dblclick', event => event.preventDefault(), { passive: false });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

window.addEventListener('load', () => {
  setTimeout(() => navigator.serviceWorker?.controller?.postMessage('CACHE_ALL_IMAGES'), 2500);
});
