/**
 * ============================================================
 * SILVERA QR GIFT EXPERIENCE â€” Main JavaScript
 * ============================================================
 * Static site hosted on GitHub Pages.
 * Fetches data from a published Google Sheet (CSV export).
 * ============================================================
 */

// â”€â”€â”€ Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONFIG = {
  // Replace with your published Google Sheet CSV URL:
  // Go to Google Sheets â†’ File â†’ Share â†’ Publish to web â†’ CSV
  // URL format: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFHr3-8LF00Z2TP1HLDjUMFjvr0HnJiU5qg9h_0sYUrww3XXnm7B6cMyCFyet0DcDs1WOJ5yjz-WsC/pub?output=csv',

  MAX_ATTEMPTS: 3,
  PARTICLE_COUNT: 45,
  TYPEWRITER_SPEED: 38, // ms per character
};

// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let giftData = null;
let attempts = 0;
let particlesInitialized = false;

// â”€â”€â”€ DOM Cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const $ = (id) => document.getElementById(id);

const DOM = {
  // Screens
  splash:    $('splash'),
  unlock:    $('unlock'),
  reveal:    $('reveal'),
  error:     $('error'),

  // Splash
  loadingState: $('loading-state'),
  btnOpen:      $('btn-open'),

  // Unlock
  lockIcon:     $('lock-icon'),
  unlockForm:   $('unlock-form'),
  selectDay:    $('select-day'),
  selectMonth:  $('select-month'),
  selectYear:   $('select-year'),
  unlockError:  $('unlock-error'),
  unlockAttempts: $('unlock-attempts'),
  btnUnlock:    $('btn-unlock'),

  // Reveal
  revealHeading:  $('reveal-heading'),
  messageBox:     $('message-box'),
  messageText:    $('message-text'),
  gallerySection: $('gallery-section'),
  photoGallery:   $('photo-gallery'),
  musicSection:   $('music-section'),
  videoSection:   $('video-section'),
  voiceSection:   $('voice-section'),
  voicePlayer:    $('voice-player'),

  // Lightbox
  lightbox:      $('lightbox'),
  lightboxImg:   $('lightbox-img'),
  lightboxClose: $('lightbox-close'),

  // Error
  errorText: $('error-text'),

  // Canvas
  canvas: $('particles-canvas'),
};

// â”€â”€â”€ Initialization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('DOMContentLoaded', init);

async function init() {
  initParticles();
  populateDateDropdowns();
  setupLightbox();

  const id = new URLSearchParams(window.location.search).get('id');

  // Sheet URL not configured (development mode â€” show demo)
  if (CONFIG.SHEET_URL === 'YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
    giftData = getDemoData(id || 'demo');
    onDataReady();
    return;
  }

  // No ID in URL (production mode)
  if (!id) {
    showErrorScreen('This link seems incomplete.', 'Please make sure you scanned the correct QR code.');
    return;
  }

  // Fetch real data
  try {
    const rows = await fetchSheetData();
    const match = rows.find(r => r.id && r.id.trim().toLowerCase() === id.trim().toLowerCase());

    if (!match) {
      showErrorScreen("This gift doesn't exist or has expired.", 'Please check with the person who gave you this gift.');
      return;
    }

    giftData = match;
    onDataReady();
  } catch (err) {
    console.error('Fetch error:', err);
    showErrorScreen('Something went wrong.', 'Please try refreshing the page.');
  }
}

function onDataReady() {
  // Hide loader, show button
  if (DOM.loadingState) DOM.loadingState.classList.add('hidden');
  if (DOM.btnOpen) {
    DOM.btnOpen.style.display = '';
    DOM.btnOpen.addEventListener('click', () => showScreen('unlock'));
  }
}

// â”€â”€â”€ Demo Data (for development/testing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getDemoData(id) {
  return {
    id: id,
    date: '2024-02-14',
    message: 'Every moment with you feels like a beautiful dream I never want to wake up from. You are my sunshine, my heart, my everything. Happy Anniversary, my love. Here\'s to a lifetime of us. â¤ï¸',
    photo1: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80',
    photo2: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=600&q=80',
    photo3: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80',
    photo4: '',
    photo5: '',
    song_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    video_url: '',
    name_from: 'Ahmed',
    name_to: 'Sara',
  };
}

// â”€â”€â”€ Screen Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const allScreens = ['splash', 'unlock', 'reveal', 'error'];

function showScreen(name) {
  allScreens.forEach(s => {
    const el = DOM[s];
    if (el) el.classList.remove('active');
  });
  const target = DOM[name];
  if (target) target.classList.add('active');
}

function showErrorScreen(title, subtitle) {
  if (DOM.errorText) DOM.errorText.textContent = title;
  const sub = DOM.error?.querySelector('.error-screen-sub');
  if (sub && subtitle) sub.textContent = subtitle;
  // Hide loading on splash
  if (DOM.loadingState) DOM.loadingState.classList.add('hidden');
  showScreen('error');
}

// â”€â”€â”€ Google Sheets Fetch & CSV Parse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchSheetData() {
  const res = await fetch(CONFIG.SHEET_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
}

/**
 * Simple CSV parser that handles:
 * - Header row â†’ keys
 * - Quoted fields (with commas inside)
 * - Double-escaped quotes ("")
 * - Empty fields
 */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result = [];
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);

    if (i === 0) {
      headers = fields.map(h => h.trim().toLowerCase());
    } else {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = (fields[j] || '').trim();
      }
      result.push(obj);
    }
  }

  return result;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// â”€â”€â”€ Date Dropdowns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function populateDateDropdowns() {
  if (!DOM.selectDay || !DOM.selectMonth || !DOM.selectYear) return;

  // Days 1-31
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = d;
    DOM.selectDay.appendChild(opt);
  }

  // Months
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  months.forEach((name, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx + 1).padStart(2, '0');
    opt.textContent = name;
    DOM.selectMonth.appendChild(opt);
  });

  // Years 2000â€“2030 (descending)
  for (let y = 2030; y >= 2000; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = y;
    DOM.selectYear.appendChild(opt);
  }

  // Form submit
  if (DOM.unlockForm) {
    DOM.unlockForm.addEventListener('submit', handleUnlockSubmit);
  }
}

// â”€â”€â”€ Unlock Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function handleUnlockSubmit(e) {
  e.preventDefault();
  if (!giftData) return;

  const day = DOM.selectDay.value;
  const month = DOM.selectMonth.value;
  const year = DOM.selectYear.value;

  if (!day || !month || !year) {
    showUnlockError('Please select a complete date.');
    return;
  }

  // Normalize input to D-M-YYYY for comparison
  const inputDay = parseInt(day, 10);
  const inputMonth = parseInt(month, 10);
  const inputYear = parseInt(year, 10);

  // Parse the correct date (supports D-M-YYYY, DD-MM-YYYY, YYYY-MM-DD)
  const correct = parseFlexibleDate(giftData.date.trim());

  if (correct && inputDay === correct.d && inputMonth === correct.m && inputYear === correct.y) {
    onUnlockSuccess();
  } else {
    onUnlockFail();
  }
}

/**
 * Parses dates in multiple formats:
 * - D-M-YYYY or DD-MM-YYYY (e.g., 6-6-2025)
 * - YYYY-MM-DD (e.g., 2025-06-06)
 * - D/M/YYYY or DD/MM/YYYY
 */
function parseFlexibleDate(str) {
  if (!str) return null;
  const parts = str.split(/[-\/]/);
  if (parts.length !== 3) return null;

  let d, m, y;
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
    // D-M-YYYY
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);
  }
  return { d, m, y };
}

function onUnlockSuccess() {
  // Clear error
  if (DOM.unlockError) {
    DOM.unlockError.textContent = '';
    DOM.unlockError.classList.remove('visible');
  }

  // Animate lock
  if (DOM.lockIcon) DOM.lockIcon.classList.add('unlocked');
  if (DOM.btnUnlock) DOM.btnUnlock.disabled = true;

  // Transition to reveal after animation
  setTimeout(() => {
    renderRevealScreen();
    showScreen('reveal');
  }, 900);
}

function onUnlockFail() {
  attempts++;
  const remaining = CONFIG.MAX_ATTEMPTS - attempts;

  // Shake animation
  if (DOM.unlockForm) {
    DOM.unlockForm.classList.add('shake');
    setTimeout(() => DOM.unlockForm.classList.remove('shake'), 600);
  }

  if (remaining <= 0) {
    showUnlockError('Ask your special someone for a hint ðŸ’«');
    if (DOM.unlockAttempts) DOM.unlockAttempts.textContent = '';
  } else {
    showUnlockError('That\'s not the right date. Try again.');
    if (DOM.unlockAttempts) {
      DOM.unlockAttempts.textContent = `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`;
    }
  }
}

function showUnlockError(msg) {
  if (DOM.unlockError) {
    DOM.unlockError.textContent = msg;
    DOM.unlockError.classList.add('visible');
  }
}

// â”€â”€â”€ Reveal Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Maps the user's sheet columns to internal names.
 * Supports both original format and the user's actual format:
 *   Sheet: ID, DATE, message, VOICE, photo 1-5, SONG, vedio, from, to
 *   Also: id, date, message, photo1..5, song_url, video_url, name_from, name_to
 */
function getField(name) {
  if (!giftData) return '';
  // Direct match (lowercased by CSV parser)
  if (giftData[name] !== undefined) return giftData[name];
  // Aliases
  const aliases = {
    name_from: ['from', 'name_from'],
    name_to: ['to', 'name_to'],
    song_url: ['song', 'song_url'],
    video_url: ['vedio', 'video', 'video_url'],
    voice_url: ['voice', 'voice_url'],
  };
  if (aliases[name]) {
    for (const alt of aliases[name]) {
      if (giftData[alt] !== undefined && giftData[alt].trim()) return giftData[alt];
    }
  }
  return '';
}

function getPhotos() {
  // Try individual photo columns first (photo1, photo2, ...)
  const individual = [giftData.photo1, giftData.photo2, giftData.photo3, giftData.photo4, giftData.photo5]
    .filter(url => url && url.trim());
  if (individual.length > 0) return individual.map(toDirectImageUrl);

  // Try the combined "photo 1-5" column (comma or space separated URLs)
  const combined = giftData['photo 1-5'] || giftData['photos'] || '';
  if (combined.trim()) {
    return combined.split(/[,\n]+/).map(u => u.trim()).filter(u => u.startsWith('http')).map(toDirectImageUrl);
  }

  return [];
}

/**
 * Converts various URL formats to direct image URLs:
 * - Google Drive: drive.google.com/file/d/ID/... â†’ lh3.googleusercontent.com/d/ID
 * - Google Drive open: drive.google.com/open?id=ID â†’ lh3.googleusercontent.com/d/ID
 * - Already direct URLs: returned as-is
 */
function toDirectImageUrl(url) {
  if (!url) return url;
  url = url.trim();

  // Google Drive: /file/d/FILE_ID/...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Google Drive: /open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }

  // Google Drive: export/download?id=FILE_ID
  const driveExportMatch = url.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveExportMatch) {
    return `https://lh3.googleusercontent.com/d/${driveExportMatch[1]}`;
  }

  return url;
}

/**
 * Converts Google Drive URLs to direct audio URLs.
 * For Google Drive: uses export/download format.
 */
function toDirectAudioUrl(url) {
  if (!url) return url;
  url = url.trim();

  // Google Drive: /file/d/FILE_ID/...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Google Drive: /open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveOpenMatch[1]}`;
  }

  return url;
}

function renderRevealScreen() {
  if (!giftData) return;

  // Header: "From X to Y"
  const nameFrom = getField('name_from');
  const nameTo = getField('name_to');
  if (DOM.revealHeading && (nameFrom || nameTo)) {
    DOM.revealHeading.textContent = `From ${nameFrom} to ${nameTo}`;
  }

  // Love Letter (typewriter)
  if (giftData.message && giftData.message.trim() && DOM.messageText) {
    DOM.messageBox.style.display = '';
    setTimeout(() => typeWriter(DOM.messageText, giftData.message.trim(), CONFIG.TYPEWRITER_SPEED), 600);
  } else if (DOM.messageBox) {
    DOM.messageBox.style.display = 'none';
  }

  // Photos
  const photos = getPhotos();
  if (photos.length > 0 && DOM.photoGallery) {
    DOM.gallerySection.style.display = '';
    DOM.photoGallery.innerHTML = '';

    photos.forEach((url, i) => {
      const item = document.createElement('div');
      item.className = 'photo-item';

      const img = document.createElement('img');
      img.src = url.trim();
      img.alt = `Memory ${i + 1}`;
      img.loading = 'lazy';

      item.appendChild(img);
      DOM.photoGallery.appendChild(item);
    });
  } else if (DOM.gallerySection) {
    DOM.gallerySection.style.display = 'none';
  }

  // Music
  const songUrl = getField('song_url');
  if (songUrl) {
    const embed = createMediaEmbed(songUrl.trim());
    if (embed && DOM.musicSection) {
      DOM.musicSection.style.display = '';
      DOM.musicSection.innerHTML = '';
      DOM.musicSection.appendChild(embed);
    }
  } else if (DOM.musicSection) {
    DOM.musicSection.style.display = 'none';
  }

  // Video
  const videoUrl = getField('video_url');
  if (videoUrl) {
    const embed = createMediaEmbed(videoUrl.trim());
    if (embed && DOM.videoSection) {
      DOM.videoSection.style.display = '';
      DOM.videoSection.innerHTML = '';
      DOM.videoSection.appendChild(embed);
    }
  } else if (DOM.videoSection) {
    DOM.videoSection.style.display = 'none';
  }

  // Voice Note
  const voiceUrl = getField('voice_url');
  if (voiceUrl && DOM.voicePlayer && DOM.voiceSection) {
    DOM.voiceSection.style.display = '';
    DOM.voicePlayer.src = toDirectAudioUrl(voiceUrl.trim());
  } else if (DOM.voiceSection) {
    DOM.voiceSection.style.display = 'none';
  }

  // Staggered reveal animations
  const animEls = document.querySelectorAll('.reveal-animate');
  animEls.forEach((el, i) => {
    el.style.animationDelay = `${0.15 + i * 0.2}s`;
    setTimeout(() => el.classList.add('visible'), 100 + i * 200);
  });
}

// â”€â”€â”€ Media Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function createMediaEmbed(url) {
  // YouTube
  const ytId = getYouTubeId(url);
  if (ytId) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${ytId}?rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    return iframe;
  }

  // Spotify Track
  const spTrack = getSpotifyId(url, 'track');
  if (spTrack) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://open.spotify.com/embed/track/${spTrack}?theme=0`;
    iframe.allow = 'encrypted-media';
    iframe.loading = 'lazy';
    iframe.style.height = '80px';
    iframe.style.aspectRatio = 'auto';
    iframe.style.borderRadius = '12px';
    return iframe;
  }

  // Spotify Playlist
  const spPlaylist = getSpotifyId(url, 'playlist');
  if (spPlaylist) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://open.spotify.com/embed/playlist/${spPlaylist}?theme=0`;
    iframe.allow = 'encrypted-media';
    iframe.loading = 'lazy';
    iframe.style.height = '380px';
    iframe.style.aspectRatio = 'auto';
    iframe.style.borderRadius = '12px';
    return iframe;
  }

  // Google Drive Video
  const driveId = getDriveFileId(url);
  if (driveId) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://drive.google.com/file/d/${driveId}/preview`;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    return iframe;
  }

  return null;
}

/**
 * Extracts Google Drive file ID from various URL formats
 */
function getDriveFileId(url) {
  const match1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];

  const match2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  const match3 = url.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (match3) return match3[1];

  return null;
}

function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function getSpotifyId(url, type) {
  const regex = new RegExp(`spotify\\.com\\/${type}\\/([a-zA-Z0-9]+)`);
  const match = url.match(regex);
  return match ? match[1] : null;
}

// â”€â”€â”€ Typewriter Effect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function typeWriter(element, text, speed = 40) {
  let i = 0;
  element.textContent = '';
  element.classList.add('typewriter-cursor');

  function tick() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(tick, speed);
    } else {
      element.classList.remove('typewriter-cursor');
    }
  }

  tick();
}

// â”€â”€â”€ Lightbox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setupLightbox() {
  if (!DOM.lightbox) return;

  // Delegate click on gallery photos
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.photo-item img');
    if (img) {
      DOM.lightboxImg.src = img.src;
      DOM.lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });

  const closeLightbox = () => {
    DOM.lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { DOM.lightboxImg.src = ''; }, 350);
  };

  DOM.lightboxClose?.addEventListener('click', closeLightbox);

  DOM.lightbox.addEventListener('click', (e) => {
    if (e.target === DOM.lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

// â”€â”€â”€ Particle System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function initParticles() {
  const canvas = DOM.canvas;
  if (!canvas || particlesInitialized) return;
  particlesInitialized = true;

  const ctx = canvas.getContext('2d');
  const particles = [];
  let w, h;

  const colors = [
    { r: 201, g: 169, b: 110 },  // Gold
    { r: 192, g: 192, b: 192 },  // Silver
    { r: 183, g: 110, b: 121 },  // Rose Gold
  ];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor(randomY = true) {
      this.reset(randomY);
    }

    reset(randomY = false) {
      this.x = Math.random() * w;
      this.y = randomY ? Math.random() * h : h + Math.random() * 40;
      this.size = Math.random() * 2 + 0.8;
      this.vy = -(Math.random() * 0.4 + 0.15);
      this.vx = (Math.random() - 0.5) * 0.2;
      this.alpha = Math.random() * 0.35 + 0.08;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = (Math.random() - 0.5) * 0.03;
    }

    update() {
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * 0.4 + this.vx;
      this.y += this.vy;

      if (this.y < -20) this.reset();
    }

    draw() {
      const { r, g, b } = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    particles.push(new Particle(true));
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(loop);
  }

  loop();
}
