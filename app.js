const intro = document.querySelector('#intro');
const skipIntro = document.querySelector('#skip-intro');
const replay = document.querySelector('#replay');
const page = document.querySelectorAll('body > a, body > header, body > main, body > footer');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.querySelector('#motion-toggle');
const motionKey = 'daico-motion-opt-in';
let motionOptIn = false;
try {
  motionOptIn = sessionStorage.getItem(motionKey) === 'on';
} catch {
  // The control still works for this page when storage is unavailable.
}

function motionIsReduced() {
  return reducedMotion.matches && !motionOptIn;
}

function renderMotionPreference() {
  document.documentElement.dataset.motion = motionOptIn ? 'on' : 'auto';
  motionToggle.hidden = !reducedMotion.matches;
  motionToggle.textContent = motionOptIn ? 'Disable motion' : 'Enable motion';
  window.dispatchEvent(new Event('daico:motionchange'));
}

motionToggle.addEventListener('click', () => {
  motionOptIn = !motionOptIn;
  try {
    if (motionOptIn) sessionStorage.setItem(motionKey, 'on');
    else sessionStorage.removeItem(motionKey);
  } catch {
    // Keep the current preference in memory.
  }
  renderMotionPreference();
});
reducedMotion.addEventListener('change', renderMotionPreference);
renderMotionPreference();

let introTimer;
let fadeTimer;
let returnFocus;

function finishIntro() {
  clearTimeout(introTimer);
  clearTimeout(fadeTimer);
  intro.hidden = true;
  intro.classList.remove('exiting');
  page.forEach((element) => { element.inert = false; });
  if (returnFocus) returnFocus.focus({ preventScroll: true });
}

function startIntro(trigger) {
  returnFocus = trigger;
  intro.hidden = false;
  page.forEach((element) => { element.inert = true; });
  if (trigger) skipIntro.focus({ preventScroll: true });
  introTimer = setTimeout(() => {
    if (motionIsReduced()) {
      finishIntro();
      return;
    }
    intro.classList.add('exiting');
    fadeTimer = setTimeout(finishIntro, 340);
  }, motionIsReduced() ? 900 : 1740);
}

skipIntro.addEventListener('click', () => {
  returnFocus ??= document.querySelector('.brand');
  finishIntro();
});
replay.addEventListener('click', () => startIntro(replay));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !intro.hidden) skipIntro.click();
});

const login = document.querySelector('#login');
const password = document.querySelector('#demo-password');
const toggle = document.querySelector('#toggle-password');
const signOut = document.querySelector('#sign-out');
const landing = document.querySelector('#landing');
const dashboard = document.querySelector('#dashboard');
const dashboardTitle = document.querySelector('#dashboard-title');
const navButtons = dashboard.querySelectorAll('[data-panel]');
const choices = dashboard.querySelectorAll('[data-selection]');
const choiceKey = 'daico-demo-choices';
const sessionKey = 'daico-demo-session';
const previousChoiceIds = ['interface-lab', 'data-playground', 'motion-workshop', 'build-night'];
let loginDestination;
let selected = new Set();

try {
  const storedChoices = JSON.parse(sessionStorage.getItem(choiceKey) ?? '[]');
  selected = new Set(storedChoices.map((choice) => typeof choice === 'number' ? previousChoiceIds[choice] : choice).filter(Boolean));
} catch {
  // The demo works in memory when browser storage is unavailable.
}

function setPasswordVisibility(visible) {
  password.type = visible ? 'text' : 'password';
  toggle.textContent = visible ? 'Hide' : 'Show';
  toggle.setAttribute('aria-pressed', String(visible));
}

function showPanel(panel) {
  navButtons.forEach((button) => {
    const active = button.dataset.panel === panel;
    document.getElementById(button.dataset.panel).hidden = !active;
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function renderChoices() {
  let savedCount = 0;
  let eventCount = 0;

  choices.forEach((button) => {
    const active = selected.has(button.dataset.choiceId);
    button.setAttribute('aria-pressed', String(active));
    if (!active) return;
    if (button.dataset.selection === 'project') savedCount += 1;
    else eventCount += 1;
  });

  document.querySelector('#saved-count').textContent = savedCount;
  document.querySelector('#event-count').textContent = eventCount;
}

function showDashboard(active) {
  landing.hidden = active;
  dashboard.hidden = !active;
  replay.hidden = active;
  signOut.hidden = !active;

  if (active) {
    showPanel('overview');
    renderChoices();
  }
}

navButtons.forEach((button) => button.addEventListener('click', () => showPanel(button.dataset.panel)));
choices.forEach((button) => button.addEventListener('click', () => {
  const id = button.dataset.choiceId;
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);

  try {
    sessionStorage.setItem(choiceKey, JSON.stringify([...selected]));
  } catch {
    // The current page still reflects the selection.
  }
  renderChoices();
}));

function openDashboardContent(id) {
  const target = id ? document.getElementById(id) : null;
  const panel = target?.closest('.dash-panel');
  if (!panel) return false;
  showPanel(panel.id);
  target.querySelector(target === panel ? 'h2' : 'h3').focus();
  return true;
}

document.querySelectorAll('[data-open-login]').forEach((button) => {
  button.addEventListener('click', () => {
    loginDestination = button.dataset.dashboardTarget;
    login.showModal();
  });
});
dashboard.querySelectorAll('[data-signal-destination]').forEach((button) => {
  button.addEventListener('click', () => openDashboardContent(button.dataset.signalDestination));
});
document.querySelector('#close-login').addEventListener('click', () => login.close());
login.addEventListener('close', () => {
  loginDestination = undefined;
  setPasswordVisibility(false);
});
toggle.addEventListener('click', () => setPasswordVisibility(password.type === 'password'));
document.querySelector('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    sessionStorage.setItem(sessionKey, 'active');
  } catch {
    // A demo session can still run until this page closes.
  }
  const destination = loginDestination;
  login.close();
  showDashboard(true);
  if (!openDashboardContent(destination)) dashboardTitle.focus();
});

signOut.addEventListener('click', () => {
  try {
    sessionStorage.removeItem(sessionKey);
  } catch {
    // There is no stored session to remove.
  }
  showDashboard(false);
  window.scrollTo(0, 0);
  document.querySelector('.brand').focus({ preventScroll: true });
});

let hasSession = false;
try {
  hasSession = sessionStorage.getItem(sessionKey) === 'active';
} catch {
  // Start signed out when browser storage is unavailable.
}
if (hasSession) showDashboard(true);
else if (!motionIsReduced() && !location.hash) startIntro();
