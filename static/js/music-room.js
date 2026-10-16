(() => {
  const room = document.getElementById('music-room');
  if (!room) return;
  const audio = room.querySelector('audio');
  const tracks = [...room.querySelectorAll('.music-track')];
  if (!tracks.length) return;
  const toggle = room.querySelector('.music-toggle');
  const seek = room.querySelector('.music-seek');
  const status = room.querySelector('.music-status');
  const canvas = room.querySelector('canvas');
  const pen = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, request = 0, context, gain, analyser, bins, samples, previousBins;
  let frame = 0, lastTime = 0, phase = 0, envelope = 0, visible = true;
  let width = 1, height = 1, sounding = false;
  let bass = 0, mid = 0, treble = 0, pulse = 0, pulseTarget = 0;
  let fluxAverage = 0, rmsAverage = 0, lastBeat = -1, analysisAge = 0;
  let driftTime = 0, resonance = 0;
  const strands = Array.from({ length: 4 }, () => ({ level: 0 }));
  const ease = (value, target, dt, attack, release) =>
    value + (target - value) * (1 - Math.exp(-dt / (target > value ? attack : release)));

  function resetAnalysis() {
    previousBins?.fill(0);
    fluxAverage = rmsAverage = analysisAge = pulseTarget = 0;
    lastBeat = -1;
  }

  const timeLabel = seconds => {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };

  function volume() {
    const fade = Math.min(1, audio.currentTime / 10);
    const configured = Number(tracks[current].dataset.volume ?? 1);
    const trackVolume = Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : 1;
    const level = 0.45 * trackVolume * fade * fade;
    if (gain) gain.gain.setTargetAtTime(level, context.currentTime, 0.06);
    else audio.volume = level;
  }

  function updateTime() {
    const duration = audio.duration;
    seek.disabled = !Number.isFinite(duration) || duration <= 0;
    seek.max = seek.disabled ? 100 : duration;
    seek.value = audio.currentTime;
    seek.style.setProperty('--progress', `${seek.disabled ? 0 : Math.min(100, audio.currentTime / duration * 100)}%`);
    seek.setAttribute('aria-valuetext', `${timeLabel(audio.currentTime)} / ${timeLabel(duration)}`);
    room.querySelector('.music-elapsed').textContent = timeLabel(audio.currentTime);
    room.querySelector('.music-duration').textContent = timeLabel(duration);
    volume();
  }

  function sync() {
    const playing = !audio.paused && !audio.ended;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'} ${tracks[current].dataset.title}`);
    tracks.forEach((track, index) => {
      if (index === current) track.setAttribute('aria-current', 'true');
      else track.removeAttribute('aria-current');
      track.classList.toggle('is-playing', index === current && playing);
    });
    wake();
  }

  // One audio element and one graph survive track changes; no overlapping playback.
  async function play() {
    const ticket = ++request;
    status.textContent = '';
    try {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!context && AudioEngine) {
        context = new AudioEngine();
        gain = context.createGain();
        analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.25;
        bins = new Uint8Array(analyser.frequencyBinCount);
        samples = new Float32Array(analyser.fftSize);
        previousBins = new Uint8Array(bins.length);
        // Measure after the fade/volume gain, so waves follow the audible level.
        context.createMediaElementSource(audio).connect(gain).connect(analyser).connect(context.destination);
        audio.volume = 1;
      }
      if (context?.state === 'suspended') await context.resume();
      if (ticket !== request) return;
      volume();
      await audio.play();
    } catch (error) {
      if (ticket === request && error.name !== 'AbortError') {
        status.textContent = '暂时无法播放，请再点一次播放。';
        sync();
      }
    }
  }

  function select(index, start = true) {
    ++request;
    audio.pause();
    current = (index + tracks.length) % tracks.length;
    const track = tracks[current];
    // Remote MP3 servers must allow CORS for audio analysis.
    if (new URL(track.href).origin !== location.origin) audio.crossOrigin = 'anonymous';
    else audio.removeAttribute('crossorigin');
    audio.src = track.href;
    audio.load();
    resetAnalysis();
    room.querySelector('.music-title').textContent = track.dataset.title;
    room.querySelector('.music-credit').textContent = track.dataset.credit;
    status.textContent = '';
    updateTime();
    sync();
    if (start) play();
  }

  toggle.addEventListener('click', () => {
    if (audio.paused) play();
    else { ++request; audio.pause(); }
  });
  room.querySelector('.music-prev').addEventListener('click', () => select(current - 1));
  room.querySelector('.music-next').addEventListener('click', () => select(current + 1));
  room.querySelector('.music-prev').disabled = tracks.length < 2;
  room.querySelector('.music-next').disabled = tracks.length < 2;
  tracks.forEach((track, index) => track.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (index === current) toggle.click();
    else select(index);
  }));
  seek.addEventListener('input', () => {
    if (!seek.disabled) { audio.currentTime = Number(seek.value); updateTime(); }
  });
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('loadedmetadata', updateTime);
  audio.addEventListener('durationchange', updateTime);
  audio.addEventListener('seeked', resetAnalysis);
  audio.addEventListener('play', sync);
  audio.addEventListener('playing', () => { sounding = true; status.textContent = ''; sync(); });
  audio.addEventListener('waiting', () => { sounding = false; status.textContent = '正在加载音乐…'; wake(); });
  audio.addEventListener('pause', () => { sounding = false; sync(); });
  audio.addEventListener('ended', () => {
    sounding = false;
    if (current < tracks.length - 1) select(current + 1);
    else { audio.currentTime = 0; sync(); }
  });
  audio.addEventListener('error', () => {
    sounding = false;
    status.textContent = '这首歌暂时无法加载，可以重试或选择另一首。';
    sync();
  });

  function draw() {
    if (!pen) return;
    pen.clearRect(0, 0, width, height);
    const colors = ['119,108,135', '126,146,145', '155,141,129', '137,127,154'];
    const still = reduced.matches;
    const time = still ? 0 : driftTime;
    const motion = still ? 0 : phase;
    colors.forEach((color, line) => {
      const level = still ? 0 : strands[line].level;
      const amplitude = still ? 9 : 5 + level * 44 + resonance * 14;
      const travel = motion * [1, -0.73, 0.57, -0.46][line];
      const opacity = 0.13 + level * 0.25 + pulse * 0.035;
      const gradient = pen.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(${color},${opacity * 0.22})`);
      gradient.addColorStop(0.26, `rgba(${color},${opacity * 0.85})`);
      gradient.addColorStop(0.57, `rgba(${color},${opacity})`);
      gradient.addColorStop(0.82, `rgba(${color},${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(${color},${opacity * 0.18})`);
      const points = [];
      for (let x = 0; x <= width + 5; x += 5) {
        const position = x / width;
        // Broad, asymmetrical curves: several slow currents braid the silk strands.
        const bend = Math.sin(position * Math.PI * 1.1 - time * 0.055 + line * 0.9) * 0.38;
        const silk = Math.sin(position * Math.PI * (1.65 + line * 0.12) + travel + line * 1.32 + bend)
          + Math.sin(position * Math.PI * 3.1 - travel * 0.42 + line * 0.8) * 0.16;
        const displacement = silk * amplitude;
        const limit = height * 0.32;
        const y = height * 0.5 + (line - 1.5) * 5 + limit * Math.tanh(displacement / limit);
        points.push([x, y]);
      }
      pen.beginPath();
      points.forEach(([x, y], index) => { if (index) pen.lineTo(x, y); else pen.moveTo(x, y); });
      pen.lineWidth = line === 0 ? 1.05 : 0.75;
      pen.strokeStyle = gradient;
      pen.stroke();
    });
  }

  function tick(now) {
    frame = 0;
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1000);
    lastTime = now;
    let target = 0, lowTarget = 0, midTarget = 0, highTarget = 0;
    pulseTarget *= Math.exp(-dt / 0.24);
    if (sounding && !audio.paused) {
      if (analyser) {
        analyser.getFloatTimeDomainData(samples);
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const rms = Math.sqrt(sum / samples.length);
        // RMS preserves real loud/quiet contrast; byte-spectrum averages tend to saturate.
        target = Math.min(1, Math.sqrt(Math.max(0, rms - 0.001) * 5));
        const binHz = context.sampleRate / analyser.fftSize;
        function bandLevel(from, to) {
          const start = Math.max(1, Math.floor(from / binHz));
          const end = Math.min(bins.length, Math.ceil(to / binHz));
          let power = 0;
          for (let index = start; index < end; index++) {
            const db = analyser.minDecibels + bins[index] / 255 * (analyser.maxDecibels - analyser.minDecibels);
            power += Math.pow(10, db / 10);
          }
          return Math.min(1, Math.sqrt(power) * 7) * Math.min(1, target * 3);
        }
        lowTarget = bandLevel(40, 240);
        midTarget = bandLevel(240, 2000);
        highTarget = bandLevel(2000, 6500);
        // Detect fresh attacks against a local baseline, with a refractory period.
        // This follows percussive/piano onsets rather than imposing a fixed BPM.
        const end = Math.min(bins.length, Math.ceil(3000 / binHz));
        let flux = 0;
        for (let index = 1; index < end; index++) flux += Math.max(0, bins[index] - previousBins[index]) / 255;
        flux /= Math.max(1, end - 1);
        analysisAge += dt;
        const onset = flux > Math.max(0.009, fluxAverage * 1.8);
        const accent = rms > Math.max(0.006, rmsAverage * 1.32) && flux > 0.004;
        if (analysisAge > 0.22 && rms > 0.004 && (onset || accent) && context.currentTime - lastBeat > 0.22) {
          pulseTarget = Math.min(1, target * 0.65 + flux * 9);
          lastBeat = context.currentTime;
        }
        fluxAverage = ease(fluxAverage, flux, dt, 0.75, 0.75);
        rmsAverage = ease(rmsAverage, rms, dt, 0.65, 0.65);
        previousBins.set(bins);
      } else target = 0.28;
    }
    envelope = ease(envelope, target, dt, 0.075, 0.42);
    bass = ease(bass, lowTarget, dt, 0.065, 0.36);
    mid = ease(mid, midTarget, dt, 0.09, 0.45);
    treble = ease(treble, highTarget, dt, 0.11, 0.5);
    pulse = ease(pulse, pulseTarget, dt, 0.045, 0.32);
    resonance = ease(resonance, envelope, dt, 0.38, 0.92);
    const bands = [bass, envelope, mid, treble];
    strands.forEach((strand, index) => {
      const targetLevel = envelope * 0.62 + bands[index] * 0.38;
      strand.level = ease(strand.level, targetLevel, dt, 0.13 + index * 0.13, 0.65 + index * 0.12);
    });
    driftTime += dt;
    phase += dt * (0.12 + resonance * 0.12) * Math.min(1, resonance * 5);
    draw();
    const lingering = Math.max(envelope, bass, mid, treble, pulse, resonance, ...strands.map(strand => strand.level)) > 0.002;
    if (visible && !document.hidden && !reduced.matches && (target > 0 || lingering || (sounding && !audio.paused))) {
      frame = requestAnimationFrame(tick);
    } else lastTime = 0;
  }

  function wake() {
    if (!pen || frame || !visible || document.hidden) return;
    if (reduced.matches) {
      envelope = bass = mid = treble = pulse = pulseTarget = resonance = 0;
      strands.forEach(strand => { strand.level = 0; });
      draw(); return;
    }
    frame = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    pen?.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { resetAnalysis(); wake(); }
    else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  }).observe(room);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    else { resetAnalysis(); wake(); }
  });
  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0; wake();
  });
  room.querySelector('.music-controls').hidden = false;
  room.querySelector('.music-timeline').hidden = false;
  audio.hidden = true;
  audio.controls = false;
  select(0, false);
  resize();
})();
