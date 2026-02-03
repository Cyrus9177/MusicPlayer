// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyBxaqupR47xL6kwJCGV12KNnHlwolWrF_k",
  authDomain: "music-player-f20bf.firebaseapp.com",
  projectId: "music-player-f20bf",
  storageBucket: "music-player-f20bf.firebasestorage.app",
  messagingSenderId: "236599275830",
  appId: "1:236599275830:web:a1b88dce5d1095821f8397",
  measurementId: "G-B8XK4R6SEY"
};

// Initialize Firebase
let db, storage, firebaseInitialized = false;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  firebaseInitialized = true;
  console.log('🔥 Firebase initialized successfully!');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  firebaseInitialized = false;
}

// ============================================
// STATE MANAGEMENT
// ============================================
const CURRENT_LIBRARY_KEY = 'spotify_current_library';

let currentLibrary = 'All Songs'; // Default to All Songs
let currentTrackIndex = -1;
let allTracks = [];
let filteredTracks = [];
let shuffleEnabled = false;
let shuffleOrder = [];
let currentShuffleIndex = -1;
let unsubscribeLibraries = null;
let unsubscribeTracks = null;

// ============================================
// INITIALIZE
// ============================================
async function init() {
  if (!firebaseInitialized) {
    alert('⚠️ Firebase not configured!\n\nPlease add your Firebase config to enable cloud storage.\n\nSee instructions in console.');
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  FIREBASE SETUP INSTRUCTIONS                   ║
╚═══════════════════════════════════════════════════════════════╝

1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Enable Firestore Database:
   - Go to Firestore Database → Create Database
   - Start in "production mode" or "test mode"
   
4. Enable Storage:
   - Go to Storage → Get Started
   - Start in "production mode" or "test mode"
   
5. Get your config:
   - Project Settings → General → Your apps
   - Add web app (</>) if needed
   - Copy the firebaseConfig object
   
6. Replace the firebaseConfig in this HTML file with your config

7. Security Rules (for testing - make it public):
   
   Firestore Rules (Database → Rules):
   -----------------------------------
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   
   Storage Rules (Storage → Rules):
   ---------------------------------
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }

⚠️  WARNING: These rules allow anyone to read/write.
    For production, implement proper authentication!
    `);
    return;
  }
  
  console.log('🚀 Initializing cloud-powered music player...');
  
  // Set up current library first
  currentLibrary = 'All Songs';
  document.getElementById('libraryName').textContent = 'All Songs';
  
  setupEventListeners();
  
  // Load both libraries and tracks
  await Promise.all([
    loadLibraries(),
    loadTracks()
  ]);
  
  console.log('✅ Initialization complete!');
}

// ============================================
// CUSTOM CONFIRMATION DIALOG
// ============================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  // Set icon based on type
  toastIcon.textContent = type === 'success' ? '✅' : '❌';
  toastMessage.textContent = message;
  
  // Remove existing classes
  toast.classList.remove('success', 'error', 'hiding');
  toast.classList.add(type);
  
  // Show toast
  toast.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      toast.classList.remove('show', 'hiding');
    }, 300);
  }, 3000);
}

function customConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmOverlay');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.add('show');
    
    function cleanup() {
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlayClick);
    }
    
    function handleOk() {
      cleanup();
      resolve(true);
    }
    
    function handleCancel() {
      cleanup();
      resolve(false);
    }
    
    function handleOverlayClick(e) {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    }
    
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
  });
}

// ============================================
// LIBRARY MANAGEMENT (FIREBASE)
// ============================================
async function getLibraries() {
  try {
    const snapshot = await db.collection('libraries').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting libraries:', error);
    return [];
  }
}

async function createDefaultLibrary() {
  await db.collection('libraries').add({
    name: 'Default Library',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  switchLibrary('Default Library');
}

async function createLibrary() {
  const input = document.getElementById('libraryNameInput');
  const name = input.value.trim();
  if (!name) {
    showToast('Please enter a playlist name', 'error');
    return;
  }
  
  const libraries = await getLibraries();
  if (libraries.some(lib => lib.name === name)) {
    showToast('A playlist with this name already exists', 'error');
    return;
  }
  
  await db.collection('libraries').add({
    name: name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  switchLibrary(name);
  hideNewLibraryModal();
  input.value = '';
}

function switchLibrary(name) {
  currentLibrary = name;
  localStorage.setItem(CURRENT_LIBRARY_KEY, name);
  loadLibraries();
  loadTracks();
  
  // Update library name display
  if (name === 'All Songs') {
    document.getElementById('libraryName').textContent = 'All Songs';
  } else {
    document.getElementById('libraryName').textContent = name;
  }
  
  // Show/hide upload features based on library
  const uploadBtn = document.getElementById('uploadBtn');
  
  if (name === 'All Songs') {
    // Show upload features in All Songs
    uploadBtn.style.display = 'block';
  } else {
    // Hide upload features in playlists
    uploadBtn.style.display = 'none';
  }
}

function showAllSongs() {
  switchLibrary('All Songs');
}

// ============================================
// MIGRATION TOOL (One-time fix for old songs)
// ============================================
async function migrateOldSongs() {
  if (!confirm('This will convert old songs to the new playlist format.\n\nOld format: library field\nNew format: playlists array\n\nContinue?')) return;
  
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  
  try {
    loading.classList.add('show');
    loadingText.textContent = 'Migrating songs...';
    
    // Get all tracks
    const snapshot = await db.collection('tracks').get();
    const batch = db.batch();
    let migratedCount = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Check if it has old 'library' field
      if (data.library && !data.playlists) {
        batch.update(doc.ref, {
          playlists: [data.library],  // Convert to array
          library: firebase.firestore.FieldValue.delete()  // Remove old field
        });
        migratedCount++;
      }
    });
    
    if (migratedCount > 0) {
      await batch.commit();
      alert(`✅ Successfully migrated ${migratedCount} song(s)!\n\nYour songs should now work properly!`);
      loadTracks();  // Reload to show updated songs
    } else {
      alert('✅ All songs are already in the new format!\n\nNo migration needed.');
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    alert('❌ Migration failed: ' + error.message);
  } finally {
    loading.classList.remove('show');
  }
}

async function deletePlaylist(name, libraryId) {
  const confirmed = await customConfirm(
    `Delete playlist "${name}"?`,
    'Songs will remain in other playlists and All Songs, but will be removed from this playlist.'
  );
  
  if (!confirmed) return;
  
  try {
    // Remove this playlist from all tracks that have it
    const tracksSnapshot = await db.collection('tracks').where('playlists', 'array-contains', name).get();
    const batch = db.batch();
    
    tracksSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        playlists: firebase.firestore.FieldValue.arrayRemove(name)
      });
    });
    
    await batch.commit();
    
    // Delete library
    await db.collection('libraries').doc(libraryId).delete();
    
    if (currentLibrary === name) {
      switchLibrary('All Songs');
    }
    
    console.log(`✅ Deleted playlist: ${name}`);
  } catch (error) {
    console.error('Error deleting playlist:', error);
    showToast('Failed to delete playlist: ' + error.message, 'error');
  }
}

async function loadLibraries() {
  // Unsubscribe from previous listener
  if (unsubscribeLibraries) unsubscribeLibraries();
  
  // Real-time listener for libraries
  unsubscribeLibraries = db.collection('libraries').onSnapshot(snapshot => {
    const libraries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderLibraries(libraries);
  }, error => {
    console.error('Error loading libraries:', error);
  });
}

function renderLibraries(libraries) {
  const container = document.getElementById('libraryList');
  
  // Add "All Songs" at the top
  const allSongsHTML = `
    <div class="library-item ${currentLibrary === 'All Songs' ? 'active' : ''}" onclick="switchLibrary('All Songs')">
      <span><span class="playlist-icon-small"></span>All Songs</span>
    </div>
  `;
  
  const librariesHTML = libraries.map(lib => `
    <div class="library-item ${lib.name === currentLibrary ? 'active' : ''}" onclick="switchLibrary(\`${escapeHtml(lib.name)}\`)">
      <span><span class="playlist-icon-small"></span>${escapeHtml(lib.name)}</span>
      <button class="del" onclick="event.stopPropagation();deletePlaylist(\`${escapeHtml(lib.name)}\`, \`${lib.id}\`)" title="Delete playlist">×</button>
    </div>
  `).join('');
  
  container.innerHTML = allSongsHTML + librariesHTML;
}

// ============================================
// TRACK MANAGEMENT (FIREBASE)
// ============================================
async function loadTracks() {
  if (!currentLibrary) {
    currentLibrary = 'All Songs'; // Fallback to All Songs
  }
  
  console.log('📀 Loading tracks for library:', currentLibrary);
  
  // Unsubscribe from previous listener
  if (unsubscribeTracks) unsubscribeTracks();
  
  // If "All Songs", load all tracks
  if (currentLibrary === 'All Songs') {
    unsubscribeTracks = db.collection('tracks')
      .onSnapshot(snapshot => {
        allTracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('✅ Loaded', allTracks.length, 'tracks from All Songs');
        applySearch();
      }, error => {
        console.error('Error loading tracks:', error);
      });
  } else {
    // Real-time listener for specific playlist - filter by playlists array
    unsubscribeTracks = db.collection('tracks')
      .where('playlists', 'array-contains', currentLibrary)
      .onSnapshot(snapshot => {
        allTracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('✅ Loaded', allTracks.length, 'tracks from playlist:', currentLibrary);
        applySearch();
      }, error => {
        console.error('Error loading tracks:', error);
      });
  }
}

async function addTrack(file) {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const progressBar = document.getElementById('progressBar');
  
  try {
    loading.classList.add('show');
    loadingText.textContent = `Uploading ${file.name}...`;
    progressBar.style.width = '0%';
    
    // Upload file to Firebase Storage
    const storagePath = `music/${currentLibrary}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(storagePath);
    const uploadTask = storageRef.put(file);
    
    // Monitor upload progress
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = progress + '%';
        loadingText.textContent = `Uploading ${file.name}... ${Math.round(progress)}%`;
      },
      (error) => {
        console.error('Upload error:', error);
        throw error;
      }
    );
    
    // Wait for upload to complete
    await uploadTask;
    
    loadingText.textContent = 'Getting download URL...';
    const downloadURL = await storageRef.getDownloadURL();
    
    loadingText.textContent = 'Saving to database...';
    
    // Save track metadata to Firestore
    await db.collection('tracks').add({
      name: file.name,
      playlists: [currentLibrary === 'All Songs' ? 'Default Library' : currentLibrary], // Array of playlists
      fileUrl: downloadURL,
      storagePath: storagePath,
      size: file.size,
      type: file.type,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully uploaded: ${file.name}`);
    return true;
    
  } catch (error) {
    console.error('Error adding track:', error);
    showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
    return false;
  } finally {
    loading.classList.remove('show');
    progressBar.style.width = '0%';
  }
}

async function deleteTrack(id) {
  // If we're in a specific playlist (not All Songs), just remove from that playlist
  if (currentLibrary !== 'All Songs') {
    const confirmed = await customConfirm(
      `Remove this track from "${currentLibrary}"?`,
      'The track will remain in other playlists and All Songs.'
    );
    
    if (!confirmed) return;
    
    try {
      const trackRef = db.collection('tracks').doc(id);
      await trackRef.update({
        playlists: firebase.firestore.FieldValue.arrayRemove(currentLibrary)
      });
      console.log(`✅ Track removed from playlist: ${currentLibrary}`);
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      showToast('Failed to remove track from playlist: ' + error.message, 'error');
    }
  } else {
    // If we're in All Songs, delete the track completely
    const confirmed = await customConfirm(
      'Delete this track completely?',
      'It will be removed for all users from all playlists!'
    );
    
    if (!confirmed) return;
    
    try {
      const doc = await db.collection('tracks').doc(id).get();
      const track = doc.data();
      
      // Delete from storage - try to delete the file
      if (track.storagePath) {
        try {
          await storage.ref(track.storagePath).delete();
          console.log('✅ File deleted from storage');
        } catch (storageError) {
          console.warn('⚠️ Could not delete file from storage (may already be deleted):', storageError.message);
          // Continue anyway - the database entry is more important
        }
      }
      
      // Delete from database
      await db.collection('tracks').doc(id).delete();
      
      console.log('✅ Track deleted successfully');
    } catch (error) {
      console.error('Error deleting track:', error);
      showToast('Failed to delete track: ' + error.message, 'error');
    }
  }
}

// clearLibrary() feature removed: clearing all music is dangerous and has been disabled.
// If you want to re-enable, implement proper auth and add explicit confirmation.

function applySearch() {
  const query = document.getElementById('searchBox').value.toLowerCase();
  const sortBy = document.getElementById('sortSelect').value;
  
  // Filter by search query
  filteredTracks = query ? allTracks.filter(t => t.name.toLowerCase().includes(query)) : [...allTracks];
  
  // Sort the filtered tracks
  if (sortBy === 'az') {
    filteredTracks.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'za') {
    filteredTracks.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === 'recent') {
    // Sort by createdAt timestamp (most recent first)
    filteredTracks.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }
  
  renderTracks();
}

function renderTracks() {
  const container = document.getElementById('trackList');
  const empty = document.getElementById('emptyState');
  
  if (filteredTracks.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  container.innerHTML = filteredTracks.map((track, idx) => {
    const playlistsText = track.playlists ? track.playlists.join(', ') : 'Unknown';
    return `
    <div class="track ${currentTrackIndex === idx ? 'playing' : ''}" onclick="playTrack(${idx})">
      <div class="track-index">${currentTrackIndex === idx ? '♪' : idx + 1}</div>
      <div class="track-info">
        <div class="track-cover">♫</div>
        <div class="track-details">
          <div class="track-title">${escapeHtml(track.name)}</div>
          <div class="track-meta">${formatBytes(track.size)} • ${escapeHtml(playlistsText)}</div>
        </div>
      </div>
      <div class="track-duration">—</div>
      <div class="track-actions">
        ${currentLibrary === 'All Songs' ? `<button class="icon-btn" onclick="event.stopPropagation();showAddToPlaylistModal('${track.id}')" title="Add to playlist">+</button>` : ''}
        <button class="icon-btn" onclick="event.stopPropagation();deleteTrack('${track.id}')" title="Delete">×</button>
      </div>
    </div>
  `}).join('');
}

// ============================================
// PLAYBACK CONTROLS
// ============================================
function playTrack(index) {
  if (index < 0 || index >= filteredTracks.length) return;
  currentTrackIndex = index;
  const track = filteredTracks[index];
  const audio = document.getElementById('audio');
  audio.src = track.fileUrl;
  audio.play();
  document.getElementById('nowPlaying').textContent = track.name;
  document.getElementById('nowArtist').textContent = track.library;
  document.getElementById('playIcon').style.display = 'none';
  document.getElementById('pauseIcon').style.display = 'block';
  document.getElementById('playerCover').textContent = '♫';
  renderTracks();
}

function togglePlay() {
  const audio = document.getElementById('audio');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  
  if (audio.paused) {
    if (currentTrackIndex === -1 && filteredTracks.length > 0) {
      playTrack(0);
    } else {
      audio.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    }
  } else {
    audio.pause();
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  }
}

function toggleMute() {
  const audio = document.getElementById('audio');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeIcon = document.getElementById('volumeIcon');
  
  if (audio.volume > 0) {
    audio.dataset.previousVolume = audio.volume;
    audio.volume = 0;
    volumeSlider.value = 0;
    volumeIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
  } else {
    const previousVolume = parseFloat(audio.dataset.previousVolume || 0.7);
    audio.volume = previousVolume;
    volumeSlider.value = previousVolume * 100;
    updateVolumeSliderBackground(previousVolume * 100);
    volumeIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
  }
}

function nextTrack() {
  if (filteredTracks.length === 0) return;
  
  if (shuffleEnabled) {
    currentShuffleIndex = (currentShuffleIndex + 1) % shuffleOrder.length;
    playTrack(shuffleOrder[currentShuffleIndex]);
  } else {
    playTrack((currentTrackIndex + 1) % filteredTracks.length);
  }
}

function previousTrack() {
  if (filteredTracks.length === 0) return;
  
  if (shuffleEnabled) {
    currentShuffleIndex = (currentShuffleIndex - 1 + shuffleOrder.length) % shuffleOrder.length;
    playTrack(shuffleOrder[currentShuffleIndex]);
  } else {
    playTrack((currentTrackIndex - 1 + filteredTracks.length) % filteredTracks.length);
  }
}

// --- Scrubbing state for pointer events ---
let isScrubbing = false;
let scrubRaf = null;
let scrubTime = null;
let lastSeekTime = 0;
const SEEK_THROTTLE = 50; // ms between audio.currentTime updates

function getTimeFromPointer(e, bar, duration) {
  const rect = bar.getBoundingClientRect();
  const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  let percent = (x - rect.left) / rect.width;
  percent = Math.max(0, Math.min(1, percent));
  return percent * duration;
}

function onProgressPointerDown(e) {
  const audio = document.getElementById('audio');
  const bar = e.currentTarget;
  if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) return;
  e.preventDefault();
  bar.setPointerCapture && bar.setPointerCapture(e.pointerId);
  isScrubbing = true;
  document.body.style.userSelect = 'none';
  scrubTime = getTimeFromPointer(e, bar, audio.duration);
  updateScrubUI(scrubTime, true);
  // Immediately update on click
  audio.currentTime = scrubTime;
  lastSeekTime = Date.now();
}

function onProgressPointerMove(e) {
  if (!isScrubbing) return;
  const audio = document.getElementById('audio');
  const bar = document.getElementById('progressBar2');
  if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) return;
  e.preventDefault();
  scrubTime = getTimeFromPointer(e, bar, audio.duration);
  
  if (!scrubRaf) {
    scrubRaf = requestAnimationFrame(() => {
      // Always update UI for smooth visual feedback
      updateScrubUI(scrubTime, true);
      
      // Throttle actual audio seeking to reduce stuttering
      const now = Date.now();
      if (now - lastSeekTime >= SEEK_THROTTLE) {
        audio.currentTime = scrubTime;
        lastSeekTime = now;
      }
      
      scrubRaf = null;
    });
  }
}

function onProgressPointerUp(e) {
  if (!isScrubbing) return;
  const audio = document.getElementById('audio');
  const bar = document.getElementById('progressBar2');
  if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) return;
  e.preventDefault();
  bar.releasePointerCapture && bar.releasePointerCapture(e.pointerId);
  isScrubbing = false;
  document.body.style.userSelect = '';
  
  if (scrubTime != null) {
    // Final seek to exact position
    audio.currentTime = scrubTime;
    updateScrubUI(scrubTime, false);
  }
  scrubTime = null;
}

function onProgressPointerCancel(e) {
  isScrubbing = false;
  scrubTime = null;
  document.body.style.userSelect = '';
}

function updateScrubUI(time, instant) {
  const audio = document.getElementById('audio');
  const progressFilled = document.getElementById('progressFilled');
  const progressThumb = document.getElementById('progressThumb');
  const currentTimeLabel = document.getElementById('currentTime');
  if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) return;
  let percent = Math.max(0, Math.min(1, time / audio.duration));
  if (instant) {
    progressFilled.classList.add('instant');
    if (progressThumb) progressThumb.classList.add('instant');
  } else {
    progressFilled.classList.remove('instant');
    if (progressThumb) progressThumb.classList.remove('instant');
  }
  progressFilled.style.width = (percent * 100) + '%';
  if (progressThumb) {
    progressThumb.style.left = (percent * 100) + '%';
  }
  currentTimeLabel.textContent = formatTime(time);
}

function updateVolumeSliderBackground(value) {
  const slider = document.getElementById('volumeSlider');
  slider.style.background = `linear-gradient(to right, var(--text) 0%, var(--text) ${value}%, rgba(255,255,255,.2) ${value}%, rgba(255,255,255,.2) 100%)`;
}

function toggleShuffle() {
  shuffleEnabled = !shuffleEnabled;
  const shuffleBtn = document.getElementById('shuffleBtn');
  
  if (shuffleEnabled) {
    // Create shuffled order
    generateShuffleOrder();
    shuffleBtn.style.color = 'var(--accent)';
    shuffleBtn.style.background = 'rgba(30,215,96,.15)';
    showToast('🔀 Shuffle enabled', 'success');
  } else {
    shuffleBtn.style.color = '';
    shuffleBtn.style.background = '';
    showToast('🔀 Shuffle disabled', 'success');
  }
}

function generateShuffleOrder() {
  // Create array of indices
  shuffleOrder = Array.from({ length: filteredTracks.length }, (_, i) => i);
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
  }
  
  // Find current track in shuffle order
  if (currentTrackIndex !== -1) {
    currentShuffleIndex = shuffleOrder.indexOf(currentTrackIndex);
  } else {
    currentShuffleIndex = 0;
  }
}

// ============================================
// FILE HANDLING
// ============================================
async function handleFiles(files) {
  console.log('📂 handleFiles called with', files.length, 'files');
  
  const audioFiles = Array.from(files).filter(f => {
    const isAudio = f.type.startsWith('audio/') || 
           f.name.toLowerCase().endsWith('.mp3') || 
           f.name.toLowerCase().endsWith('.wav') || 
           f.name.toLowerCase().endsWith('.m4a') || 
           f.name.toLowerCase().endsWith('.ogg') || 
           f.name.toLowerCase().endsWith('.flac');
    console.log(`File: ${f.name}, Type: ${f.type}, IsAudio: ${isAudio}`);
    return isAudio;
  });
  
  console.log('🎵 Found', audioFiles.length, 'audio files to upload');
  
  if (audioFiles.length === 0) {
    showToast('Please select audio files! Supported: MP3, WAV, M4A, OGG, FLAC', 'error');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];
    console.log(`⬆️ Uploading ${i + 1}/${audioFiles.length}: ${file.name}`);
    const success = await addTrack(file);
    if (success) {
      successCount++;
      console.log(`✅ Success! (${successCount}/${audioFiles.length})`);
    } else {
      failCount++;
      console.log(`❌ Failed! (${failCount} failures)`);
    }
  }
  
  console.log(`🎉 Upload complete! Success: ${successCount}, Failed: ${failCount}`);
  
  if (successCount > 0) {
    showToast(`Successfully uploaded ${successCount} of ${audioFiles.length} song(s) to the cloud! 🔥`, 'success');
  }
  
  if (failCount > 0) {
    showToast(`${failCount} song(s) failed to upload. Check console for details.`, 'error');
  }
}

// ============================================
// STORAGE INFO
// ============================================
async function showStorageInfo() {
  try {
    const libs = await getLibraries();
    const snapshot = await db.collection('tracks').get();
    let totalSize = 0;
    let tracksByLib = {};
    
    snapshot.docs.forEach(doc => {
      const track = doc.data();
      totalSize += track.size || 0;
      tracksByLib[track.library] = (tracksByLib[track.library] || 0) + 1;
    });
    
    // Update modal content
    document.getElementById('storageTotalTracks').textContent = snapshot.size;
    document.getElementById('storageTotalSize').textContent = (totalSize / 1024 / 1024).toFixed(2) + ' MB';
    document.getElementById('storageTotalLibs').textContent = libs.length;
    
    // Show modal
    document.getElementById('storageOverlay').classList.add('show');
    
  } catch (error) {
    console.error('Error getting storage info:', error);
    showToast('Failed to get storage info: ' + error.message, 'error');
  }
}

function hideStorageModal() {
  document.getElementById('storageOverlay').classList.remove('show');
}

// ============================================
// UI HELPERS
// ============================================
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// MODAL
// ============================================
function showNewLibraryModal() {
  document.getElementById('newLibraryModal').classList.add('show');
  document.getElementById('libraryNameInput').focus();
}

function hideNewLibraryModal() {
  document.getElementById('newLibraryModal').classList.remove('show');
}

let selectedTrackToAdd = null;

async function showAddToPlaylistModal(trackId) {
  selectedTrackToAdd = trackId;
  const modal = document.getElementById('addToPlaylistModal');
  const container = document.getElementById('playlistSelector');
  
  // Load all playlists
  const libraries = await getLibraries();
  
  if (libraries.length === 0) {
    container.innerHTML = `
      <div style="padding:40px 20px;text-align:center;color:var(--muted);background:rgba(255,255,255,.03);border-radius:12px">
        <div style="font-size:48px;margin-bottom:16px;opacity:.5">📁</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">No playlists yet!</div>
        <div style="font-size:14px">Create a playlist first to organize your music</div>
      </div>
    `;
  } else {
    container.innerHTML = libraries.map(lib => `
      <div class="playlist-selector-item" onclick="addToPlaylist('${escapeHtml(lib.name)}')">
        <div class="playlist-icon">📁</div>
        <div class="playlist-name">${escapeHtml(lib.name)}</div>
      </div>
    `).join('');
  }
  
  modal.classList.add('show');
}

function hideAddToPlaylistModal() {
  document.getElementById('addToPlaylistModal').classList.remove('show');
  selectedTrackToAdd = null;
}

async function addToPlaylist(playlistName) {
  if (!selectedTrackToAdd) return;
  
  try {
    // Get the track
    const trackDoc = await db.collection('tracks').doc(selectedTrackToAdd).get();
    const trackData = trackDoc.data();
    
    // Check if already in this playlist
    if (trackData.playlists && trackData.playlists.includes(playlistName)) {
      showToast(`This song is already in "${playlistName}"!`, 'error');
      hideAddToPlaylistModal();
      return;
    }
    
    // Add playlist to the playlists array
    await db.collection('tracks').doc(selectedTrackToAdd).update({
      playlists: firebase.firestore.FieldValue.arrayUnion(playlistName)
    });
    
    showToast(`Added to "${playlistName}"!`, 'success');
    hideAddToPlaylistModal();
    
  } catch (error) {
    console.error('Error adding to playlist:', error);
    showToast('Failed to add to playlist: ' + error.message, 'error');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  const fileInput = document.getElementById('fileInput');
  const audio = document.getElementById('audio');
  const volumeSlider = document.getElementById('volumeSlider');
  const searchBox = document.getElementById('searchBox');
  const progressBar = document.getElementById('progressBar2');

  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  });

  // --- Progress bar pointer events ---
  if (progressBar) {
    progressBar.addEventListener('pointerdown', onProgressPointerDown);
    progressBar.addEventListener('pointermove', onProgressPointerMove);
    progressBar.addEventListener('pointerup', onProgressPointerUp);
    progressBar.addEventListener('pointercancel', onProgressPointerCancel);
    progressBar.style.touchAction = 'none';
  }

  audio.addEventListener('timeupdate', () => {
    if (!isScrubbing) {
      const progress = (audio.currentTime / audio.duration) * 100 || 0;
      document.getElementById('progressFilled').style.width = progress + '%';
      document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
      // Move thumb in sync with progress
      const progressThumb = document.getElementById('progressThumb');
      if (progressThumb) {
        progressThumb.style.left = progress + '%';
      }
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('duration').textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    nextTrack();
  });

  if (audio) {
    audio.addEventListener('play', () => {
      const playIcon = document.getElementById('playIcon');
      const pauseIcon = document.getElementById('pauseIcon');
      if (playIcon && pauseIcon) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      }
    });
    audio.addEventListener('pause', () => {
      const playIcon = document.getElementById('playIcon');
      const pauseIcon = document.getElementById('pauseIcon');
      if (playIcon && pauseIcon) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', e => {
      const value = e.target.value;
      const volumeIcon = document.getElementById('volumeIcon');
      if (audio) audio.volume = value / 100;
      updateVolumeSliderBackground(value);
      // Update icon based on volume
      if (volumeIcon) {
        if (value == 0) {
          volumeIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        } else {
          volumeIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        }
      }
    });
  }

  if (searchBox) {
    searchBox.addEventListener('input', applySearch);
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', applySearch);
  }

  const libraryNameInput = document.getElementById('libraryNameInput');
  if (libraryNameInput) {
    libraryNameInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') createLibrary();
    });
  }

  const newLibraryModal = document.getElementById('newLibraryModal');
  if (newLibraryModal) {
    newLibraryModal.addEventListener('click', e => {
      if (e.target.id === 'newLibraryModal') hideNewLibraryModal();
    });
  }

  const addToPlaylistModal = document.getElementById('addToPlaylistModal');
  if (addToPlaylistModal) {
    addToPlaylistModal.addEventListener('click', e => {
      if (e.target.id === 'addToPlaylistModal') hideAddToPlaylistModal();
    });
  }

  // Storage modal click outside to close
  const storageOverlay = document.getElementById('storageOverlay');
  if (storageOverlay) {
    storageOverlay.addEventListener('click', e => {
      if (e.target.id === 'storageOverlay') hideStorageModal();
    });
  }

  audio.volume = 0.7;
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================
// SEEK TO FUNCTION (fixes ReferenceError when called from UI)
function seekTo(seconds) {
  const audio = document.getElementById('audio');
  if (!audio) return;
  if (seconds == null || isNaN(seconds)) return;
  try {
    const clamped = Math.max(0, Math.min(seconds, audio.duration || Infinity));
    audio.currentTime = clamped;
  } catch (e) {
    // ignore if audio not ready
  }
}

window.migrateOldSongs = migrateOldSongs;
window.showAllSongs = showAllSongs;
window.switchLibrary = switchLibrary;
window.deletePlaylist = deletePlaylist;
window.createLibrary = createLibrary;
window.showNewLibraryModal = showNewLibraryModal;
window.hideNewLibraryModal = hideNewLibraryModal;
window.showAddToPlaylistModal = showAddToPlaylistModal;
window.hideAddToPlaylistModal = hideAddToPlaylistModal;
window.addToPlaylist = addToPlaylist;
window.deleteTrack = deleteTrack;
window.playTrack = playTrack;
window.togglePlay = togglePlay;
window.nextTrack = nextTrack;
window.previousTrack = previousTrack;
window.seekTo = function(seconds) {
  const audio = document.getElementById('audio');
  if (!audio) return;
  if (seconds == null || isNaN(seconds)) return;
  try {
    const clamped = Math.max(0, Math.min(seconds, audio.duration || Infinity));
    audio.currentTime = clamped;
  } catch (e) {
    // ignore if audio not ready
  }
};
window.showStorageInfo = showStorageInfo;
window.hideStorageModal = hideStorageModal;

// ============================================
// LIVE CLOCK
// ============================================
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  const timeStr = `${hours12}:${minutes}:${seconds} ${ampm}`;
  const greetingTimeEl = document.getElementById('greetingTime');
  if (greetingTimeEl) {
    greetingTimeEl.textContent = timeStr;
  }
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

// ============================================
// START
// ============================================
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('DOMContentLoaded', startClock);
