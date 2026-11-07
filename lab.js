const signalChannels = {
  ai: { title: 'AI', target: 28, activity: 'AI Prototype Lab', destination: 'ai-prototype' },
  data: { title: 'Data Science', target: 54, activity: 'Data Playground', destination: 'data-playground' },
  both: { title: 'Both', target: 79, activity: 'AI & Data Science projects', destination: 'projects' },
};
const lab = document.querySelector('#signal-lab');
const channelOptions = lab.querySelectorAll('input[name="signal-channel"]');
const frequency = document.querySelector('#frequency');
const readout = document.querySelector('#frequency-readout');
const targetLabel = document.querySelector('#signal-target');
const lock = document.querySelector('#lock-signal');
const feedback = document.querySelector('#signal-feedback');
const scope = lab.querySelector('.lab-scope');
const scopeState = document.querySelector('#scope-state');
const targetWave = document.querySelector('#scope-target');
const liveWave = document.querySelector('#scope-wave');
const labCount = document.querySelector('#signal-count');
const dashboardSignalCount = document.querySelector('#dashboard-signal-count');
const signalLog = document.querySelectorAll('[data-signal-log]');
const coreProfile = document.querySelector('#core-profile');
const labRecommendation = document.querySelector('#lab-recommendation');
const matchesLink = document.querySelector('#lab-matches-link');
const signalKey = 'daico-locked-signals';
let lockedSignals = new Set();

try {
  const storedSignals = JSON.parse(sessionStorage.getItem(signalKey) ?? '[]');
  lockedSignals = new Set(storedSignals.filter((id) => Object.hasOwn(signalChannels, id)));
} catch {
  // Tuning still works with in-memory state.
}

const lastSignal = [...lockedSignals].at(-1);
let selectedChannel = lastSignal ?? 'ai';

function applyCoreProfile(id) {
  document.documentElement.dataset.activeSignal = id;
  coreProfile.textContent = `DAICO CORE / ${signalChannels[id].title.toUpperCase()}`;
}
if (lastSignal) {
  applyCoreProfile(lastSignal);
  frequency.value = signalChannels[lastSignal].target;
}

function makeWave(hertz) {
  const cycles = hertz / 19;
  const amplitude = 20 + hertz * .37;
  const points = [];
  for (let x = 0; x <= 480; x += 4) {
    const y = 95 + Math.sin(x / 480 * Math.PI * 2 * cycles) * amplitude;
    points.push(`${x} ${y.toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

function renderSignalLog() {
  const count = `${lockedSignals.size} / ${Object.keys(signalChannels).length} locked`;
  labCount.textContent = count;
  dashboardSignalCount.textContent = count;
  signalLog.forEach((card) => {
    const active = lockedSignals.has(card.dataset.signalLog);
    card.classList.toggle('is-locked', active);
    card.querySelector('.signal-log-state').textContent = active ? 'Signal locked' : 'Not locked';
    card.querySelector('[data-signal-destination]').hidden = !active;
  });
}

function renderScope() {
  const channel = signalChannels[selectedChannel];
  const hertz = Number(frequency.value);
  const matched = hertz === channel.target;
  const recommendedChannel = Math.abs(hertz - channel.target) <= 2 ? selectedChannel : '';
  matchesLink.hidden = !recommendedChannel;
  if (lab.dataset.recommendedChannel !== recommendedChannel) {
    lab.dataset.recommendedChannel = recommendedChannel;
    lab.dispatchEvent(new Event('daico:recommendations'));
  }
  const unlocked = lockedSignals.has(selectedChannel);
  const isLocked = matched && unlocked;
  labRecommendation.hidden = !unlocked;
  labRecommendation.dataset.dashboardTarget = channel.destination;
  labRecommendation.textContent = `Sign in to open ${channel.activity}`;
  lab.dataset.channel = selectedChannel;
  scope.style.setProperty('--lab-rotation', `${hertz * .8 - 54}deg`);
  readout.textContent = `${hertz} Hz`;
  frequency.setAttribute('aria-valuetext', `${hertz} hertz`);
  targetLabel.textContent = `Target: ${channel.target} Hz · ${channel.activity}`;
  scopeState.textContent = isLocked ? 'LOCKED' : matched ? 'IN SYNC' : 'TUNING';
  targetWave.setAttribute('d', makeWave(channel.target));
  liveWave.setAttribute('d', makeWave(hertz));
}

channelOptions.forEach((option) => {
  option.checked = option.value === selectedChannel;
  option.addEventListener('change', () => {
    selectedChannel = option.value;
    feedback.textContent = '';
    renderScope();
  });
});

frequency.addEventListener('input', () => {
  feedback.textContent = '';
  renderScope();
});

lock.addEventListener('click', () => {
  const channel = signalChannels[selectedChannel];
  if (Number(frequency.value) !== channel.target) {
    feedback.textContent = `Tune to ${channel.target} Hz to lock ${channel.title}.`;
    return;
  }

  lockedSignals.delete(selectedChannel);
  lockedSignals.add(selectedChannel);
  applyCoreProfile(selectedChannel);
  try {
    sessionStorage.setItem(signalKey, JSON.stringify([...lockedSignals]));
  } catch {
    // Keep the active signals available for this page.
  }

  renderScope();
  renderSignalLog();
  feedback.textContent = `Signal locked. Your DAICO Core is now set to ${channel.title}.`;
  if (!motionIsReduced() && typeof scope.animate === 'function') {
    scope.animate([{ boxShadow: '0 0 0 0 var(--lab-accent)' }, { boxShadow: '0 0 0 12px transparent' }], 420);
  }
});

renderScope();
renderSignalLog();
