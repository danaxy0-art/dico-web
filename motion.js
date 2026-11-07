const coreTemplate = document.querySelector('#core-template');
document.querySelectorAll('[data-core]').forEach((mount) => {
  mount.append(coreTemplate.content.cloneNode(true));
});

const hero = document.querySelector('#hero');
const heroCore = hero.querySelector('.hero-core');
const story = document.querySelector('#signal');
const signalProgress = document.querySelector('#signal-progress');

let activeTouch;
let resetTimer;

function resetCore() {
  clearTimeout(resetTimer);
  ['--core-y', '--core-x', '--eye-x'].forEach((property) => heroCore.style.removeProperty(property));
}

function trackCore(event) {
  if (motionIsReduced()) return;
  const touch = event.pointerType === 'touch';
  if (touch && activeTouch !== event.pointerId) return;
  clearTimeout(resetTimer);

  const bounds = (touch ? heroCore : hero).getBoundingClientRect();
  const clamp = (value) => Math.max(-1, Math.min(1, value));
  const x = clamp(((event.clientX - bounds.left) / bounds.width - .5) * 2);
  const y = clamp(((event.clientY - bounds.top) / bounds.height - .5) * 2);
  heroCore.style.setProperty('--core-y', `${x * 35 - 12}deg`);
  heroCore.style.setProperty('--core-x', `${y * -26 - 11}deg`);
  heroCore.style.setProperty('--eye-x', `${x * 9}px`);
}

heroCore.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' || !event.isPrimary || motionIsReduced()) return;
  activeTouch = event.pointerId;
  trackCore(event);
});
hero.addEventListener('pointermove', trackCore);
hero.addEventListener('pointerleave', (event) => {
  if (event.pointerType !== 'touch') resetCore();
});
heroCore.addEventListener('pointerup', (event) => {
  if (activeTouch !== event.pointerId) return;
  activeTouch = undefined;
  resetTimer = setTimeout(resetCore, 650);
});
heroCore.addEventListener('pointercancel', (event) => {
  if (activeTouch !== event.pointerId) return;
  activeTouch = undefined;
  resetCore();
});

let frameRequest;
function updateSignal() {
  frameRequest = undefined;
  if (motionIsReduced() || story.offsetHeight === 0) return;

  const bounds = story.getBoundingClientRect();
  const viewport = window.innerHeight;
  const distance = Math.max(1, bounds.height - viewport * .32);
  const progress = Math.max(0, Math.min(1, (viewport * .68 - bounds.top) / distance));
  story.style.setProperty('--draw', String(.79 * (1 - progress)));
  story.style.setProperty('--signal-y', `${progress * 265 - 40}deg`);
  story.style.setProperty('--signal-x', `${-18 + progress * 36}deg`);
  story.style.setProperty('--signal-rise', `${-progress * 30}px`);
  signalProgress.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
}

function requestSignalUpdate() {
  if (frameRequest === undefined) frameRequest = requestAnimationFrame(updateSignal);
}
window.addEventListener('scroll', requestSignalUpdate, { passive: true });
window.addEventListener('resize', requestSignalUpdate);
window.addEventListener('daico:motionchange', () => {
  if (motionIsReduced()) {
    activeTouch = undefined;
    resetCore();
  }
  requestSignalUpdate();
});
requestSignalUpdate();
