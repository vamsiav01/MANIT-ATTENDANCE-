# 🔧 Backend Guide — MANIT Attendance App

How to create a backend for your MANIT Self-Attendance Tracker.

---

## Option A: Node.js + Express + MongoDB (Recommended)

This is the most flexible and production-ready approach.

### 1. Project Setup

```bash
mkdir manit-attendance-backend
cd manit-attendance-backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

### 2. Project Structure

```
manit-attendance-backend/
├── server.js
├── .env
├── config/
│   └── db.js
├── models/
│   ├── User.js
│   ├── Subject.js
│   └── Attendance.js
├── routes/
│   ├── auth.js
│   ├── subjects.js
│   └── attendance.js
├── middleware/
│   └── auth.js
└── package.json
```

### 3. Database Connection (`config/db.js`)

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 4. Models

**User Model (`models/User.js`)**:
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  scholarNo: { type: String, required: true },
  branch: { type: String, enum: ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE'], default: 'CSE' },
  section: { type: String, enum: ['A', 'B'], default: 'A' },
  year: { type: Number, min: 1, max: 4, default: 1 },
  semester: { type: Number, min: 1, max: 8, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
```

**Subject Model (`models/Subject.js`)**:
```javascript
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  teacher: { type: String, default: '' },
  days: [{ type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] }],
  periodsPerDay: { type: Number, default: 1 },
  totalClasses: { type: Number, default: 0 },
  attended: { type: Number, default: 0 },
  color: { type: String, default: '#3b82f6' },
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
```

**Attendance Model (`models/Attendance.js`)**:
```javascript
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true }, // format: YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent', 'holiday'], required: true },
}, { timestamps: true });

// Unique constraint: one entry per user+subject+date
AttendanceSchema.index({ userId: 1, subjectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
```

### 5. Auth Middleware (`middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};
```

### 6. Routes

**Auth Routes (`routes/auth.js`)**:
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, scholarNo, branch, section, year, semester } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user = new User({ name, email, password: hash, scholarNo, branch, section, year, semester });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name, email, scholarNo, branch, section, year, semester } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email, scholarNo: user.scholarNo, branch: user.branch, section: user.section, year: user.year, semester: user.semester } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
```

**Subject Routes (`routes/subjects.js`)**:
```javascript
const express = require('express');
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const router = express.Router();

// GET /api/subjects — get all subjects for user
router.get('/', auth, async (req, res) => {
  const subjects = await Subject.find({ userId: req.user.userId });
  res.json(subjects);
});

// POST /api/subjects — create a subject
router.post('/', auth, async (req, res) => {
  const subject = new Subject({ ...req.body, userId: req.user.userId });
  await subject.save();
  res.status(201).json(subject);
});

// PUT /api/subjects/:id — update a subject
router.put('/:id', auth, async (req, res) => {
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    req.body,
    { new: true }
  );
  res.json(subject);
});

// DELETE /api/subjects/:id — delete a subject
router.delete('/:id', auth, async (req, res) => {
  await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  res.json({ msg: 'Subject deleted' });
});

module.exports = router;
```

**Attendance Routes (`routes/attendance.js`)**:
```javascript
const express = require('express');
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const router = express.Router();

// POST /api/attendance/mark — mark attendance
router.post('/mark', auth, async (req, res) => {
  const { subjectId, date, status } = req.body;
  
  // Upsert: update if exists, create if not
  const existing = await Attendance.findOne({ userId: req.user.userId, subjectId, date });
  
  if (existing) {
    // Undo old mark on subject counters
    const subject = await Subject.findById(subjectId);
    if (existing.status === 'present') {
      subject.attended -= 1;
      subject.totalClasses -= 1;
    } else if (existing.status === 'absent') {
      subject.totalClasses -= 1;
    }
    // holiday: no counter change
    
    // Apply new mark
    if (status === 'present') {
      subject.attended += 1;
      subject.totalClasses += 1;
    } else if (status === 'absent') {
      subject.totalClasses += 1;
    }
    // holiday: no counter change
    
    await subject.save();
    existing.status = status;
    await existing.save();
    return res.json(existing);
  }
  
  // New mark
  const subject = await Subject.findById(subjectId);
  if (status === 'present') {
    subject.attended += 1;
    subject.totalClasses += 1;
  } else if (status === 'absent') {
    subject.totalClasses += 1;
  }
  // holiday: no counter change
  await subject.save();
  
  const attendance = new Attendance({ userId: req.user.userId, subjectId, date, status });
  await attendance.save();
  res.status(201).json(attendance);
});

// DELETE /api/attendance/undo — undo attendance
router.post('/undo', auth, async (req, res) => {
  const { subjectId, date } = req.body;
  const record = await Attendance.findOneAndDelete({ userId: req.user.userId, subjectId, date });
  
  if (record && record.status !== 'holiday') {
    const subject = await Subject.findById(subjectId);
    if (record.status === 'present') {
      subject.attended -= 1;
      subject.totalClasses -= 1;
    } else if (record.status === 'absent') {
      subject.totalClasses -= 1;
    }
    await subject.save();
  }
  
  res.json({ msg: 'Attendance undone' });
});

// GET /api/attendance/history — get all history for user
router.get('/history', auth, async (req, res) => {
  const records = await Attendance.find({ userId: req.user.userId }).sort({ date: -1 });
  // Transform to { [date]: { [subjectId]: status } }
  const history = {};
  records.forEach((r) => {
    if (!history[r.date]) history[r.date] = {};
    history[r.date][r.subjectId] = r.status;
  });
  res.json(history);
});

module.exports = router;
```

### 7. Server Entry (`server.js`)

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/attendance', require('./routes/attendance'));

app.get('/', (req, res) => res.json({ msg: 'MANIT Attendance API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 8. Environment Variables (`.env`)

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/manit-attendance
JWT_SECRET=your-super-secret-key-change-this
PORT=5000
```

### 9. Deployment

- **MongoDB Atlas**: Free tier at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- **Backend hosting**: [Render](https://render.com) or [Railway](https://railway.app) — free tier available
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

---

## Option B: Firebase (Faster/Simpler)

If you want a quicker setup without managing a server.

### 1. Setup

```bash
npm install firebase
```

### 2. Firebase Config (`src/config/firebase.js`)

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 3. Firestore Collections

```
users/
  {userId}/
    profile: { name, scholarNo, branch, section, year, semester }

subjects/
  {subjectId}/
    userId, name, code, teacher, days, periodsPerDay, totalClasses, attended, color

attendance/
  {recordId}/
    userId, subjectId, date, status
```

### 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /subjects/{subjectId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /attendance/{recordId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Migration Strategy

To switch your current localStorage-based app to use a backend:

1. **Create an auth context** — manage login/register state
2. **Replace localStorage calls** in `AttendanceContext.jsx` with API calls
3. **Keep localStorage as a cache** — load from API on login, cache locally for offline support
4. **Use `useEffect`** to sync changes to the backend
5. **Add loading/error states** for API calls

### Example: Updating AttendanceContext to use API

```javascript
// In AttendanceContext.jsx, replace localStorage with fetch calls:

const addSubject = async (subject) => {
  try {
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(subject),
    });
    const data = await res.json();
    setSubjects((prev) => [...prev, data]);
    showToast(`${subject.name} added`);
  } catch (err) {
    showToast('Failed to add subject', 'error');
  }
};
```

---

## Quick Start Checklist

- [ ] Choose backend approach (Node.js+MongoDB or Firebase)
- [ ] Set up MongoDB Atlas / Firebase project
- [ ] Create the backend project and models
- [ ] Set up authentication (JWT or Firebase Auth)
- [ ] Create API routes / Firestore rules
- [ ] Update frontend to call APIs instead of localStorage
- [ ] Deploy backend to Render/Railway or use Firebase hosting
- [ ] Deploy frontend to Vercel/Netlify
