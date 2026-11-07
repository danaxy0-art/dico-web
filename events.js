(() => {
  const events = [
    {
      id: 'ai-prototype-lab', interests: ['ai'], type: 'workshop', title: 'AI Prototype Lab', track: 'Artificial Intelligence',
      format: 'In person', duration: '2 hours', level: 'Beginner',
      description: 'Sketch an AI assistant, test sample prompts, and define what a useful answer looks like.',
      agenda: ['Pick a real task for your assistant.', 'Write and test three prompts.', 'Compare results using a simple evaluation checklist.'],
    },
    {
      id: 'data-stories', interests: ['data'], type: 'session', title: 'From Data to Decisions', track: 'Data Science',
      format: 'Online', duration: '60 minutes', level: 'Open to all',
      description: 'Walk through a small dataset and see how a clear question can lead to a better decision.',
      agenda: ['Start with a decision and work backward.', 'Read a chart in context.', 'Discuss what the evidence can support.'],
    },
    {
      id: 'python-data-bootcamp', interests: ['data'], type: 'bootcamp', title: 'Python for Data Science', track: 'Data Science',
      format: 'In person', duration: '3 days', level: 'Beginner',
      description: 'Work through a hands-on introduction to cleaning, exploring, and visualizing data in Python.',
      agenda: ['Load and inspect a dataset.', 'Clean data and summarize patterns.', 'Build a short visual report.'],
    },
    {
      id: 'build-night', interests: ['ai', 'data'], type: 'meetup', title: 'DAICO Build Night', track: 'AI & Data Science',
      format: 'In person', duration: '90 minutes', level: 'Open to all',
      description: 'Bring a side project or an early idea, meet other builders, and share a short demo.',
      agenda: ['Meet other AI and data enthusiasts.', 'Share a project or an idea.', 'Find people to build with.'],
    },
  ];
  const labels = { workshop: 'Workshop', session: 'Session', bootcamp: 'Bootcamp', meetup: 'Meetup' };
  const catalog = document.querySelector('#public-events');
  const catalogTitle = document.querySelector('#public-events-title');
  const grid = document.querySelector('#event-grid');
  const lab = document.querySelector('#signal-lab');
  const recommendationSection = document.querySelector('#signal-recommendations');
  const recommendationGrid = document.querySelector('#signal-event-grid');
  const recommendationSummary = document.querySelector('#signal-event-summary');
  const channelLabels = { ai: 'AI', data: 'Data Science', both: 'AI and Data Science' };
  const search = document.querySelector('#event-search');
  const empty = document.querySelector('#event-empty');
  const results = document.querySelector('#event-result');
  const dialog = document.querySelector('#event-dialog');
  const rsvp = document.querySelector('#event-rsvp');
  const status = document.querySelector('#event-rsvp-status');
  const storageKey = 'daico-demo-event-rsvps';
  let saved = new Set();
  let current;
  let openingLink;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    saved = new Set(stored.filter((id) => events.some((event) => event.id === id)));
  } catch {
    // The registration preview is usable when storage is unavailable.
  }

  function eventCard(event) {
    const number = String(events.indexOf(event) + 1).padStart(2, '0');
    return `
    <article class="event-card" data-event-card="${event.id}" data-event-kind="${event.type}">
      <div class="event-card-top">
        <span class="event-kind">${labels[event.type]}</span>
        <span aria-hidden="true">${number} / DAICO</span>
      </div>
      <p class="event-track">${event.track}</p>
      <h3>${event.title}</h3>
      <p class="event-card-description">${event.description}</p>
      <div class="event-card-bottom">
        <span>${event.format} · ${event.duration}</span>
        <a href="#event-${event.id}" aria-label="View details for ${event.title}">View details <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  `;
  }

  grid.innerHTML = events.map(eventCard).join('');
  const cards = grid.querySelectorAll('[data-event-card]');

  function filterEvents() {
    const type = document.querySelector('input[name="event-type"]:checked').value;
    const query = search.value.trim().toLowerCase();
    let count = 0;
    cards.forEach((card, index) => {
      const event = events[index];
      const matchesType = type === 'all' || type === event.type;
      const words = `${event.title} ${event.track} ${event.description}`.toLowerCase();
      card.hidden = !matchesType || !words.includes(query);
      if (!card.hidden) count += 1;
    });
    results.textContent = `${count} ${count === 1 ? 'event' : 'events'}`;
    empty.hidden = count !== 0;
  }

  function renderRecommendations() {
    const channel = lab.dataset.recommendedChannel;
    recommendationGrid.replaceChildren();
    if (!channelLabels[channel]) {
      recommendationSummary.textContent = 'Tune within 2 Hz of your target to see matching events.';
      return;
    }

    const matches = channel === 'both'
      ? events.filter((event) => event.interests.some((interest) => interest === 'ai' || interest === 'data'))
        .sort((first, second) => second.interests.length - first.interests.length)
      : events.filter((event) => event.interests.includes(channel));

    recommendationSummary.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? 'event' : 'events'} matching ${channelLabels[channel]}.`
      : `No matching events for ${channelLabels[channel]} right now. Browse all events for more options.`;
    recommendationGrid.innerHTML = matches.map(eventCard).join('');
  }

  function updateRsvp() {
    const registered = saved.has(current.id);
    rsvp.textContent = registered ? 'Cancel demo RSVP' : 'Try registration';
    status.textContent = registered ? 'Demo RSVP saved.' : '';
  }

  function showEvent(event) {
    current = event;
    const fields = { type: `${labels[event.type]} / SAMPLE EVENT`, title: event.title,
      description: event.description, format: event.format, duration: event.duration, level: event.level };
    for (const [field, value] of Object.entries(fields)) {
      document.querySelector(`#event-dialog-${field}`).textContent = value;
    }
    document.querySelector('#event-dialog-agenda').replaceChildren(...event.agenda.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    updateRsvp();
    if (!dialog.open) dialog.showModal();
  }

  function syncEvent() {
    const event = events.find((entry) => location.hash === `#event-${entry.id}`);
    if ((event || location.hash === '#public-events') && !document.querySelector('#dashboard').hidden) {
      showDashboard(false);
    }
    if (event) {
      if (!openingLink) catalog.scrollIntoView();
      showEvent(event);
    } else if (dialog.open) dialog.close();
  }

  rsvp.addEventListener('click', () => {
    const cancelling = saved.delete(current.id);
    if (!cancelling) saved.add(current.id);
    let persisted = false;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...saved]));
      persisted = true;
    } catch {
      // Fall back to keeping the choice for this page.
    }
    updateRsvp();
    status.textContent = cancelling ? 'Demo RSVP cancelled.' : persisted ? 'Demo RSVP saved on this device.' : 'Demo RSVP saved for this visit.';
  });

  [grid, recommendationGrid].forEach((eventGrid) => {
    eventGrid.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) openingLink = link;
    });
  });
  document.querySelector('#event-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (current && location.hash === `#event-${current.id}`) {
      const fromRecommendations = openingLink && recommendationSection.contains(openingLink);
      history.replaceState(null, '', fromRecommendations ? '#signal-recommendations' : '#public-events');
      if (openingLink) openingLink.focus({ preventScroll: true });
      else {
        catalog.scrollIntoView();
        catalogTitle.focus({ preventScroll: true });
      }
    }
    current = undefined;
    openingLink = undefined;
  });
  search.addEventListener('input', filterEvents);
  document.querySelector('.event-filters').addEventListener('change', filterEvents);
  document.querySelector('.public-events-link').addEventListener('click', () => {
    if (!document.querySelector('#dashboard').hidden) showDashboard(false);
  });
  window.addEventListener('hashchange', syncEvent);
  lab.addEventListener('daico:recommendations', renderRecommendations);
  filterEvents();
  renderRecommendations();
  syncEvent();
})();
