# 🚀 Deployment Guide — MANIT Attendance App

How to publish your MANIT Attendance app for public access and generate an APK for mobile.

---

## Step 1: Deploy to Vercel (Free & Easiest)

### 1.1 Push to GitHub

```bash
# Initialize git (if not already)
cd internship-project
git init
git add .
git commit -m "Initial commit - MANIT Attendance App"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/manit-attendance.git
git branch -M main
git push -u origin main
```

### 1.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `manit-attendance` repository
4. Vercel auto-detects Vite — keep the default settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**
6. Your app will be live at `https://manit-attendance-XXXX.vercel.app`

> **Custom Domain (Optional):** In Vercel Dashboard → Settings → Domains, add your own domain.

---

## Step 2: Configure Firebase for Production

### 2.1 Add Your Vercel URL to Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project **"manit-attendance"**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"** and add:
   - `your-app-name.vercel.app` (your Vercel URL)
   - `localhost` (should already be there for dev)

### 2.2 Enable Google Sign-In

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → Enable it
3. Set a support email
4. Click **Save**

### 2.3 Enable Email/Password Sign-In

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Email/Password** → Enable it
3. Click **Save**

### 2.4 Deploy Firestore Security Rules

Option A — Via Firebase Console:
1. Go to **Firestore Database** → **Rules**
2. Paste these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
3. Click **Publish**

Option B — Via Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

---

## Step 3: Generate APK for Android (Mobile Install)

Your app is already a PWA (Progressive Web App), which means users can install it directly from the browser. But if you want a proper APK:

### Option A: Browser Install (No APK needed!)

When users visit your deployed app on Android Chrome:
1. They'll see a **"Install App"** button in the header (we added this!)
2. Or the browser shows an **"Add to Home Screen"** banner
3. This installs the app to their phone — looks and feels like a native app

### Option B: Generate APK with PWABuilder

1. Deploy your app first (Step 1)
2. Go to [pwabuilder.com](https://www.pwabuilder.com)
3. Enter your deployed URL (e.g., `https://manit-attendance.vercel.app`)
4. Click **"Start"** → PWABuilder analyzes your PWA
5. Click **"Package for stores"** → Select **"Android"**
6. Download the generated APK/AAB file
7. You can share this APK via:
   - **Google Drive** link
   - **GitHub Releases** (attach the APK to a release)
   - **Telegram/WhatsApp** direct file share

### Option C: Bubblewrap (Advanced — for Play Store)

```bash
npm install -g @nicedayfor/nicedayfor
nicedayfor init --manifest="https://your-app.vercel.app/manifest.json"
nicedayfor build
```

This generates an Android App Bundle (AAB) you can upload to Google Play Store.

---

## Step 4: Share Your App

### Public URL
Share the Vercel link: `https://your-app.vercel.app`

### QR Code
Generate a QR code at [qr-code-generator.com](https://www.qr-code-generator.com/) pointing to your app URL.

### APK Distribution
If you generated an APK:
1. Upload to Google Drive
2. Set sharing to "Anyone with the link"
3. Share the download link

---

## Quick Checklist

- [ ] Push code to GitHub
- [ ] Deploy on Vercel
- [ ] Add Vercel URL to Firebase Authorized domains
- [ ] Enable Google Sign-In in Firebase
- [ ] Enable Email/Password in Firebase
- [ ] Deploy Firestore rules
- [ ] Test Google Login on deployed URL
- [ ] Test the "Install App" button on mobile
- [ ] (Optional) Generate APK on pwabuilder.com

---

## Troubleshooting

### "auth/unauthorized-domain" error
→ Add your deployment URL to Firebase → Authentication → Authorized domains

### Google Sign-In popup doesn't work on mobile
→ The app automatically falls back to redirect-based sign-in on mobile

### Data not syncing
→ Check Firestore rules are deployed correctly
→ Check browser console for errors

### "Install App" button not showing
→ The browser must determine the app is installable (requires HTTPS + valid manifest)
→ Works on Chrome/Edge for Android. Not supported on iOS Safari (use "Add to Home Screen" instead)
