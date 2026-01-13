# Deploy Multi-User Music Player to GitHub Pages

This guide shows how to host your Spotify-like music player with **multi-user library support** on GitHub Pages for free.

---

## 🚀 Quick Start: Test Locally First

**Right now**, double-click `github-pages.html` to test it in your browser.

You should see:
- ✅ Spotify-inspired dark UI with sidebar
- ✅ "Create New Library" button 
- ✅ Drag & drop music upload
- ✅ Full playback controls with progress bar
- ✅ Search functionality

Try creating a library (e.g., "John's Music") and uploading a song!

---

## 📦 Deploy to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to **https://github.com** and sign in
2. Click **"New repository"** (green button)
3. Repository settings:
   - **Name**: `spotify-music-player` (or any name you like)
   - **Visibility**: **Public** (required for free GitHub Pages)
   - ✅ Check **"Add a README file"**
4. Click **"Create repository"**

### Step 2: Upload the File

**Option A: Web Upload (Easiest)**

1. In your new repo, click **"Add file"** → **"Upload files"**
2. Drag `github-pages.html` from your computer
3. Commit message: `Add multi-user music player`
4. Click **"Commit changes"**

**Option B: Git Command Line**

```powershell
cd "c:\Users\Cyrus\OneDrive\Documents\Project"
git init
git remote add origin https://github.com/YOUR_USERNAME/spotify-music-player.git
git add github-pages.html
git commit -m "Add multi-user music player"
git push -u origin main
```

### Step 3: Rename to index.html

GitHub Pages looks for `index.html` as the homepage:

1. Click on `github-pages.html` in your repo
2. Click the **pencil icon** (Edit this file)
3. Change filename from `github-pages.html` to `index.html`
4. Scroll down → Commit: `Rename to index.html`

### Step 4: Enable GitHub Pages

1. Go to **Settings** tab (top of your repo)
2. Scroll down to **"Pages"** in the left sidebar
3. Under **"Source"**:
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **"Save"**

### Step 5: Access Your Live Site

Wait **2-5 minutes**, then visit:

```
https://YOUR_USERNAME.github.io/spotify-music-player/
```

Replace `YOUR_USERNAME` with your GitHub username and `spotify-music-player` with your repo name.

✅ Your music player is now live!

---

## 🎵 How Multi-User Libraries Work

### For Each User Visiting the Site:

1. **First Visit**: User sees a "Default Library" created automatically
2. **Create Library**: Click **"+ New"** in sidebar → Enter name (e.g., "Sarah's Playlist")
3. **Upload Music**: Drag & drop or click **"Upload Music"** button
4. **Switch Libraries**: Click any library in the sidebar to switch between them
5. **Persistence**: All libraries and music are saved in **browser localStorage**

### Key Points:

✅ **Each user has separate storage** - John's library is only on John's browser
✅ **No server needed** - Everything works client-side with localStorage
✅ **Privacy** - No data leaves the user's browser
✅ **Multiple libraries per user** - Each person can organize music into folders

### Sharing the Site:

Share your GitHub Pages URL with friends:
```
https://YOUR_USERNAME.github.io/spotify-music-player/
```

- **Everyone sees the same interface**
- **Everyone creates their own libraries**
- **Nobody can see other users' music** (browser-local storage)

---

## ✨ Features

### Spotify-Inspired Interface
- 🎨 Dark theme with sidebar navigation
- 📁 Library selector with create/delete
- 🔍 Real-time search/filter
- 🎵 Track list with play controls

### Player Controls
- ⏯️ Play/pause/skip tracks
- 📊 Progress bar with seek
- 🔊 Volume slider
- ⏭️ Next/previous track
- 🔄 Auto-play next song

### Upload Options
- 📤 Drag & drop anywhere on drop zone
- 📁 Click "Upload Music" button
- 📂 Multi-file upload support
- ✅ Supports: MP3, WAV, M4A, OGG, FLAC

### Library Management
- ➕ Create unlimited libraries
- 🔄 Switch between libraries instantly
- 🗑️ Delete individual tracks or entire libraries
- 💾 Automatic save (localStorage)

---

## 🔧 Technical Details

### Storage System

Each user's browser stores:
```javascript
Libraries: ['Default Library', "John's Music", "Workout Playlist"]
Current Library: "John's Music"
Library Data:
  - library_Default Library: [{track1}, {track2}, ...]
  - library_John's Music: [{track3}, {track4}, ...]
```

### Browser Storage Limits

| Browser | Limit |
|---------|-------|
| Chrome/Edge | ~10 MB |
| Firefox | ~10 MB |
| Safari | ~5 MB |

**Typical file sizes:**
- 3-minute MP3 (128kbps): ~3 MB
- 3-minute MP3 (320kbps): ~7.5 MB

**You can store approximately 3-5 songs** before hitting limits.

### Workarounds for More Storage:

1. **Use lower bitrate files** (128kbps is good enough for most listening)
2. **Create more libraries** (each browser profile has separate storage)
3. **Use different browsers** (Chrome and Firefox have separate storage)

---

## 🎯 Use Cases

### Personal Use
- Upload your favorite songs for quick access
- Create mood-based libraries (Chill, Workout, Focus)
- No need for accounts or logins

### Sharing with Friends
- Send them your GitHub Pages link
- Everyone gets their own personal library
- No interference between users

### Demo/Portfolio
- Show off web development skills
- Demonstrate localStorage usage
- Showcase modern UI/UX design

---

## 🐛 Troubleshooting

### Files won't upload
- ✅ Check file format (MP3, WAV, M4A, OGG, FLAC)
- ✅ File might be too large (try < 5MB files)
- ✅ Check browser console (F12 → Console) for errors

### Music stops playing
- ✅ Check browser storage isn't full
- ✅ Try clearing old libraries: Click 🗑️ next to library name

### GitHub Pages not loading
- ✅ Wait 5-10 minutes after enabling Pages
- ✅ Check Settings → Pages for deployment status
- ✅ Ensure file is named exactly `index.html`

### Libraries disappeared
- ✅ Don't clear browser data/cache (it deletes localStorage)
- ✅ Check you're on the same browser & profile
- ✅ Private/incognito mode has separate storage

---

## 🚀 Next Steps (Advanced)

Want to upgrade? Here are some ideas:

### Add Cloud Storage
- Integrate **Firebase Storage** for cross-device sync
- Use **Supabase** for user accounts + cloud files
- Store files in **AWS S3** or **Cloudflare R2**

### Add Backend
- Build Node.js + Express server (see `server.js` in project)
- Deploy to **Vercel**, **Railway**, or **Heroku**
- Add PostgreSQL for user management

### Enhanced Features
- Album art extraction from MP3 metadata
- Create shareable playlists with unique URLs
- Social features (follow friends' libraries)
- Audio visualization with Web Audio API
- Lyrics display synced with playback

---

## 📝 Summary

**What you have:**
- ✅ Single-file music player (no dependencies)
- ✅ Multi-user library system (browser storage)
- ✅ Spotify-inspired professional UI
- ✅ Full playback controls + search
- ✅ Deployable to GitHub Pages for free

**How users experience it:**
1. Visit your GitHub Pages URL
2. Create a named library (e.g., "My Songs")
3. Upload music files via drag & drop
4. Play, search, and organize tracks
5. Everything saves automatically in their browser

**Share your link:**
```
https://YOUR_USERNAME.github.io/spotify-music-player/
```

Enjoy your music player! 🎵