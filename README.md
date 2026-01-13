# 🎵 Vibeify

A beautiful, modern cloud-powered music player with real-time synchronization across all users.

![Made with Firebase](https://img.shields.io/badge/Powered%20by-Firebase-orange)
![HTML/CSS/JS](https://img.shields.io/badge/Made%20with-HTML%2FCSS%2FJS-blue)
![GitHub Pages Ready](https://img.shields.io/badge/GitHub%20Pages-Ready-brightgreen)

---

## ✨ Features

### ☁️ Cloud-Powered
- **Firebase Storage** - Upload and stream music from the cloud
- **Real-time Sync** - Changes sync instantly across all users
- **Global Library** - Share music with everyone using the app

### 📁 Playlist Management
- Create unlimited custom playlists
- Add songs to multiple playlists
- Delete playlists without losing songs
- Remove songs from specific playlists
- "All Songs" view shows your entire library

### 🎨 Modern Interface
- Spotify-inspired professional design
- Sleek gradients and animations
- Drag & drop upload zone
- Real-time search and filtering
- Smooth transitions and hover effects

### 🎵 Full Music Player
- Play/pause/skip controls
- Progress bar with seek functionality
- Volume control with mute
- Track queue management
- Display current song info
- Beautiful album cover visuals

### 📤 Easy Upload
- Drag & drop music files
- Multi-file upload support
- Supports: MP3, WAV, M4A, OGG, FLAC
- Upload progress indicator

---

## 🚀 Live Demo

[View Live](https://cyrus9177.github.io/your-repo-name/)

---

## �️ Setup

### Prerequisites
- Firebase account (free)
- GitHub account (for hosting)

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In your project, go to Firestore Database
   - Click "Create database"
   - Start in test mode (or production with rules)

3. **Enable Storage**
   - Go to Storage
   - Click "Get started"
   - Use test mode rules for development

4. **Get Config**
   - Go to Project Settings → General
   - Scroll to "Your apps"
   - Click the web icon `</>`
   - Copy your Firebase config
   - Replace the config in `index.html` (lines ~293-300)

5. **Security Rules** (for development/testing)
   
   **Firestore Rules:**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   
   **Storage Rules:**
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   
   ⚠️ **Note:** These rules allow anyone to read/write. For production, implement proper authentication!

### GitHub Pages Deployment

1. Create a new repository on GitHub
2. Upload `index.html` (this is your main file)
3. Go to Settings → Pages
4. Select your branch (usually `main`)
5. Save and wait for deployment
6. Your app will be live at `https://yourusername.github.io/repo-name/`

---

## 📝 Tech Stack

- **Firebase Firestore** - Real-time database
- **Firebase Storage** - Cloud file storage
- **Vanilla JavaScript** - No frameworks needed
- **HTML5 Audio API** - Music playback
- **Modern CSS** - Gradients, animations, glassmorphism

---

## 🎨 UI Highlights

- **Vibeify Branding** - Custom animated gradient logo
- **Gradient Backgrounds** - Purple, blue, pink color schemes
- **Glassmorphic Cards** - Modern backdrop blur effects
- **Smooth Animations** - Pulsing upload zone, shimmer effects
- **Professional Typography** - Varied weights and spacing
- **Custom Scrollbars** - Thin, rounded, subtle design

---

## 👤 Author

Made by **yesh**

---

## 📄 License

Feel free to use this project for personal or educational purposes!

---

Enjoy your music! 🎶

1. **Create a GitHub repo** (public)
2. **Upload** `github-pages.html`
3. **Rename** it to `index.html`
4. **Enable GitHub Pages** in Settings
5. **Share** your URL: `https://yourusername.github.io/reponame/`

**Full instructions:** See [GITHUB_DEPLOY.md](GITHUB_DEPLOY.md)

---

## 📖 How It Works

### For Users Visiting Your Site:

1. Open the music player
2. Click **"+ New"** to create a library (e.g., "My Songs")
3. **Drag & drop** music files or click **"Upload Music"**
4. **Play** songs with full controls
5. **Search** to filter tracks
6. **Switch** between libraries in the sidebar

### Multi-User Concept:

- **Each visitor** creates their own libraries
- **Storage is local** to each user's browser (localStorage)
- **No user can see** another user's music
- **No server required** - everything runs client-side

---

## 🎯 Use Cases

✅ **Personal music library** - Quick access to favorite songs  
✅ **Share with friends** - Everyone gets their own space  
✅ **Portfolio project** - Showcase your web dev skills  
✅ **Learning tool** - Study localStorage, audio APIs, modern CSS  
✅ **Offline music player** - Works without internet after first load  

---

## 💾 Storage Details

### Browser Storage Limits:
- **Chrome/Edge**: ~10 MB
- **Firefox**: ~10 MB  
- **Safari**: ~5 MB

### Typical Usage:
- **3-min MP3 (128kbps)**: ~3 MB → Store ~3 songs
- **3-min MP3 (320kbps)**: ~7.5 MB → Store ~1-2 songs

**Tip:** Use lower bitrate files or create multiple libraries to maximize storage.

---

## 🛠️ Technical Stack

- **HTML5** - Structure and audio element
- **CSS3** - Spotify-inspired styling with CSS variables
- **Vanilla JavaScript** - No frameworks, no dependencies
- **localStorage API** - Client-side persistence
- **File API** - Drag & drop and file reading
- **Audio API** - Playback controls

**Total:** Single 15KB HTML file!

---

## 📂 Project Structure

```
Project/
├── github-pages.html      ← Complete music player (USE THIS!)
├── GITHUB_DEPLOY.md       ← Step-by-step deployment guide
├── README.md              ← This file
└── (other files)          ← Node.js server version (optional)
```

---

## 🎨 Screenshots

**Sidebar with Libraries**
- Create and switch between multiple libraries
- Each library stores its own tracks

**Main Player**
- Drag & drop upload zone
- Track list with search
- Play controls with progress bar

**Bottom Player Bar**
- Now playing info
- Playback controls (prev/play/next)
- Volume slider

---

## 🚧 Limitations

❌ **Browser-only storage** - Music doesn't sync across devices  
❌ **Storage limits** - ~5-10MB depending on browser  
❌ **No cloud backup** - Clearing browser data deletes everything  
❌ **No sharing** - Can't share playlists between users  

---

## 🔮 Future Enhancements

Want to contribute or extend this? Ideas:

- [ ] Extract album art from MP3 metadata
- [ ] Add playlist creation and management
- [ ] Integrate with Firebase for cloud storage
- [ ] Add user authentication
- [ ] Create shareable playlist URLs
- [ ] Audio visualization with Web Audio API
- [ ] Lyrics display
- [ ] Keyboard shortcuts
- [ ] Mobile app wrapper (PWA)

---

## 📝 License

MIT License - Feel free to use, modify, and distribute!

---

## 🤝 Contributing

This is a single-file project for simplicity. To contribute:

1. Fork the repo
2. Edit `github-pages.html`
3. Test locally (double-click the file)
4. Submit a pull request

---

## ⚡ Performance

- **Load time**: < 1 second
- **File size**: ~15KB (uncompressed)
- **Dependencies**: 0
- **API calls**: 0

---

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Opera | ✅ Full |

Requires: HTML5, ES6, localStorage

---

## 💡 Tips

**For best experience:**
- Use MP3 files at 128-192 kbps
- Keep filenames descriptive
- Create separate libraries for different moods/genres
- Don't clear browser data if you want to keep your music

**For developers:**
- Open browser DevTools (F12) to inspect localStorage
- Check Console for any errors
- Modify CSS variables in `:root` for custom themes

---

## 📞 Support

**Issues?** Open an issue on GitHub  
**Questions?** Check [GITHUB_DEPLOY.md](GITHUB_DEPLOY.md)  
**Ideas?** Pull requests welcome!

---

**Made with ❤️ and JavaScript**

Enjoy your music! 🎵
