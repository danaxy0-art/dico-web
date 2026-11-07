const coreTemplate = document.querySelector('#core-template');
document.querySelectorAll('[data-core]').forEach((mount) => {
  mount.append(coreTemplate.content.cloneNode(true));
});

const hero = document.querySelector('#hero');
const heroCore = hero.querySelector('.hero-core');
const story = document.querySelector('#signal');
const signalProgress = document.querySelector('#signal-progress');

function trackCore(event) {
  if (reducedMotion.matches || event.pointerType === 'touch') return;
  const bounds = hero.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
  const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
  heroCore.style.setProperty('--core-y', `${x * 35 - 12}deg`);
  heroCore.style.setProperty('--core-x', `${y * -26 - 11}deg`);
  heroCore.style.setProperty('--eye-x', `${x * 9}px`);
}

hero.addEventListener('pointermove', trackCore);
hero.addEventListener('pointerleave', () => {
  ['--core-y', '--core-x', '--eye-x'].forEach((property) => heroCore.style.removeProperty(property));
});

let frameRequest;
function updateSignal() {
  frameRequest = undefined;
  if (reducedMotion.matches || story.offsetHeight === 0) return;

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
reducedMotion.addEventListener('change', requestSignalUpdate);
requestSignalUpdate();
