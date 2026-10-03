(() => {
  const archive = document.getElementById('archive');
  const galleryPage = document.getElementById('gallery-page');
  const sketches = document.getElementById('sketch-overview');
  const source = archive || galleryPage || sketches;
  if (!source) return;

  const owner = source.dataset.galleryOwner;
  const repo = source.dataset.galleryRepo;
  const branch = source.dataset.galleryBranch || 'main';
  const path = source.dataset.galleryPath || 'gallery';
  const indexFile = source.dataset.galleryIndex || 'index.json';
  if (!owner || !repo) return;

  const encodePath = value => String(value).split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const base = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${encodePath(path)}/`;
  const imageUrl = item => item.url || base + encodePath(item.path || item.file || '');
  const cues = [
    'a trace, kept in the archive.',
    'the image remembers.',
    'something was here.',
    'a frame, briefly seen.',
    'elsewhere, another day.'
  ];

  fetch(base + encodePath(indexFile), { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Gallery index: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const items = (Array.isArray(data) ? data : data.items || [])
        .filter(item => item && (item.url || item.path || item.file))
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      if (archive) initArchive(items);
      if (galleryPage) initGallery(items);
      if (sketches) initSketches(items);
    })
    .catch(() => {
      if (archive) document.getElementById('caption').textContent = 'the archive is quiet for now.';
      if (galleryPage) document.getElementById('gallery-grid').textContent = 'The archive is quiet for now.';
      if (sketches) sketches.textContent = 'The drawings are quiet for now.';
    });

  function initArchive(items) {
    if (!items.length) return;
    const active = document.getElementById('archive-image');
    const previous = document.getElementById('archive-prev-image');
    const next = document.getElementById('archive-next-image');
    const counter = document.getElementById('counter');
    const caption = document.getElementById('caption');
    const code = document.getElementById('cel-code');
    const zoomButton = document.getElementById('archive-open');
    const lightbox = document.getElementById('art-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxTitle = document.getElementById('lightbox-title');
    const cel = active.closest('.cel');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;

    function liftCel(direction) {
      cel.querySelector('.cel-ghost')?.remove();
      active.classList.remove('cel-frame-enter');
      if (!direction || reducedMotion.matches) return;
      const ghost = active.cloneNode(false);
      ghost.removeAttribute('id');
      ghost.className = 'cel-ghost';
      ghost.alt = '';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.setProperty('--cel-out-x', direction > 0 ? '-18px' : '18px');
      active.style.setProperty('--cel-in-x', direction > 0 ? '18px' : '-18px');
      cel.appendChild(ghost);
      ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
      void active.offsetWidth;
      active.classList.add('cel-frame-enter');
      active.addEventListener('animationend', () => active.classList.remove('cel-frame-enter'), { once: true });
    }

    function show(index) {
      liftCel(index === current ? 0 : Math.sign(index - current));
      current = (index + items.length) % items.length;
      const item = items[current];
      active.src = imageUrl(item);
      active.alt = item.title || `Archive image ${current + 1}`;
      previous.src = imageUrl(items[(current - 1 + items.length) % items.length]);
      next.src = imageUrl(items[(current + 1) % items.length]);
      counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      caption.textContent = cues[current % cues.length];
      code.textContent = `A—${String(current + 1).padStart(2, '0')}`;
      if (lightbox.open) {
        lightboxImage.src = imageUrl(item);
        lightboxImage.alt = item.title || `Archive image ${current + 1}`;
        lightboxCounter.textContent = counter.textContent;
        lightboxTitle.textContent = item.title || 'Untitled';
      }
    }

    archive.querySelector('.arrow.prev').addEventListener('click', () => show(current - 1));
    archive.querySelector('.arrow.next').addEventListener('click', () => show(current + 1));
    zoomButton.disabled = false;
    zoomButton.addEventListener('click', () => {
      const item = items[current];
      lightboxImage.src = imageUrl(item);
      lightboxImage.alt = item.title || `Archive image ${current + 1}`;
      lightboxCounter.textContent = counter.textContent;
      lightboxTitle.textContent = item.title || 'Untitled';
      lightbox.showModal();
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
    lightbox.querySelector('.lightbox-arrow.prev').addEventListener('click', () => show(current - 1));
    lightbox.querySelector('.lightbox-arrow.next').addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('close', () => zoomButton.focus());
    function enableSwipe(target) {
      let startX = null;
      let startY = null;
      target.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
      }, { passive: true });
      target.addEventListener('touchend', event => {
        if (startX === null || !event.changedTouches.length) return;
        const deltaX = event.changedTouches[0].clientX - startX;
        const deltaY = event.changedTouches[0].clientY - startY;
        startX = null;
        startY = null;
        if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.3) return;
        event.preventDefault();
        show(current + (deltaX < 0 ? 1 : -1));
      }, { passive: false });
      target.addEventListener('touchcancel', () => { startX = null; startY = null; });
    }
    enableSwipe(zoomButton);
    enableSwipe(lightbox.querySelector('.lightbox-stage'));
    document.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target.closest('input, textarea, select, [contenteditable]')) return;
      if (!lightbox.open) {
        const bounds = archive.getBoundingClientRect();
        const viewportMiddle = window.innerHeight / 2;
        if (bounds.top > viewportMiddle || bounds.bottom < viewportMiddle) return;
      }
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    show(0);
  }

  function initGallery(items) {
    const grid = document.getElementById('gallery-grid');
    grid.replaceChildren();
    if (!items.length) {
      grid.textContent = 'The archive is quiet for now.';
      return;
    }
    for (const item of items) {
      const figure = document.createElement('figure');
      const link = document.createElement('a');
      const image = document.createElement('img');
      const caption = document.createElement('figcaption');
      const date = document.createElement('time');
      link.href = imageUrl(item);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      image.src = link.href;
      image.alt = item.title || 'Untitled image';
      image.loading = 'lazy';
      caption.textContent = item.title || 'Untitled';
      date.textContent = item.date || '';
      if (item.date) date.dateTime = item.date;
      link.appendChild(image);
      caption.appendChild(date);
      figure.append(link, caption);
      grid.appendChild(figure);
    }
  }

  function initSketches(items) {
    sketches.replaceChildren();
    document.getElementById('sketch-count').textContent = `${String(Math.min(items.length, 3)).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    if (!items.length) {
      sketches.textContent = 'The drawings are quiet for now.';
      return;
    }
    items.slice(0, 3).forEach((item, index) => {
      const figure = document.createElement('figure');
      const link = document.createElement('a');
      const image = document.createElement('img');
      const caption = document.createElement('figcaption');
      const number = document.createElement('span');
      const title = document.createElement('span');
      link.href = imageUrl(item);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `查看画作：${item.title || `作品 ${index + 1}`}`);
      image.src = link.href;
      image.alt = item.title || `作品 ${index + 1}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      number.textContent = String(index + 1).padStart(2, '0');
      title.textContent = item.title || 'Untitled';
      caption.append(number, title);
      link.append(image, caption);
      figure.appendChild(link);
      sketches.appendChild(figure);
    });
  }
})();

(() => {
  const player = document.getElementById('soundtrack');
  if (!player) return;

  const audio = document.getElementById('soundtrack-audio');
  const toggle = player.querySelector('.soundtrack-toggle');
  const icon = toggle.querySelector('span');
  const seek = document.getElementById('soundtrack-seek');
  const current = document.getElementById('soundtrack-current');
  const duration = document.getElementById('soundtrack-duration');
  const maxVolume = 0.45;
  const fadeSeconds = 10;
  let context;
  let gain;

  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return '--:--';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  function syncVolume() {
    const volume = maxVolume * Math.min(1, audio.currentTime / fadeSeconds);
    if (gain) {
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(volume, now);
      if (!audio.paused && audio.currentTime < fadeSeconds) {
        gain.gain.linearRampToValueAtTime(maxVolume, now + fadeSeconds - audio.currentTime);
      }
    } else {
      audio.volume = volume;
    }
  }

  function syncProgress() {
    current.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) {
      duration.textContent = formatTime(audio.duration);
      seek.value = String(audio.currentTime / audio.duration * 100 || 0);
      seek.style.setProperty('--progress', `${seek.value}%`);
    }
    if (!gain) syncVolume();
  }

  function syncButton() {
    const playing = !audio.paused;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'} Two of Me`);
    icon.textContent = playing ? 'Ⅱ' : '▶';
  }

  toggle.addEventListener('click', async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      if (!context && (window.AudioContext || window.webkitAudioContext)) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        gain = context.createGain();
        context.createMediaElementSource(audio).connect(gain).connect(context.destination);
      }
      if (context?.state === 'suspended') await context.resume();
      syncVolume();
      await audio.play();
    } catch (error) {
      toggle.setAttribute('aria-label', '音频无法播放');
    }
  });

  audio.addEventListener('loadedmetadata', syncProgress);
  audio.addEventListener('durationchange', syncProgress);
  audio.addEventListener('timeupdate', syncProgress);
  audio.addEventListener('play', () => { syncVolume(); syncButton(); });
  audio.addEventListener('pause', () => { syncVolume(); syncButton(); });
  audio.addEventListener('ended', syncButton);
  audio.addEventListener('seeked', () => { syncVolume(); syncProgress(); });
  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(seek.value) / 100;
    seek.style.setProperty('--progress', `${seek.value}%`);
  });
  syncProgress();
})();
