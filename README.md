# UniConnect ERP – USIU-Africa
## Full Setup Guide for VSCode + MySQL

---

## What You Need to Install First

| Tool | Download |
|------|----------|
| **Node.js** (v18+) | https://nodejs.org → download LTS |
| **MySQL Server** | https://dev.mysql.com/downloads/mysql/ |
| **VSCode** | https://code.visualstudio.com |
| **Git** (optional) | https://git-scm.com |

### Recommended VSCode Extensions
Open VSCode → Extensions (Ctrl+Shift+X) → search and install:
- **MySQL** by cweijan (lets you view your DB inside VSCode)
- **REST Client** by Huachao Mao (test API routes inside VSCode)
- **Prettier** (code formatting)
- **Live Server** (optional, for frontend only mode)

---

## Step 1 – Set Up MySQL

### Option A – MySQL Workbench (GUI, easiest)
1. Open MySQL Workbench
2. Connect to your local server (root / your password)
3. File → Open SQL Script → select `database/schema.sql` → click ⚡ Run
4. File → Open SQL Script → select `database/seed.sql` → click ⚡ Run

### Option B – VSCode Terminal
Open terminal in VSCode with **Ctrl + `** (backtick), then run:

```bash
# Create the database and all tables
mysql -u root -p < database/schema.sql

# Load sample data (students, faculty, courses, grades)
mysql -u root -p uniconnect_db < database/seed.sql
```

It will ask for your MySQL root password each time.

### Option C – MySQL VSCode Extension
1. Install "MySQL" by cweijan from Extensions
2. Click the database icon in the left sidebar
3. Click + to add a connection: host=localhost, user=root, port=3306
4. Right-click your connection → New Query
5. Paste contents of `schema.sql` → Run
6. Paste contents of `seed.sql` → Run

---

## Step 2 – Configure Your .env File

Open the `.env` file in the project root. Change `DB_PASSWORD` to match your MySQL password:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_MYSQL_PASSWORD   ← change this
DB_NAME=uniconnect_db
JWT_SECRET=usiu_uniconnect_super_secret_key_change_in_production
JWT_EXPIRES_IN=8h
PORT=3000
FRONTEND_URL=http://localhost:5500
```

Save the file.

---

## Step 3 – Install Node.js Packages

In the VSCode terminal (make sure you're in the project root folder):

```bash
npm install
```

This installs: express, mysql2, bcryptjs, jsonwebtoken, cors, dotenv, nodemon.

---

## Step 4 – Start the Backend Server

```bash
npm run dev
```

You should see:
```
✅ MySQL connected successfully
🚀 UniConnect API running at http://localhost:3000
   Frontend: http://localhost:3000
   API base: http://localhost:3000/api
```

If you see ❌ MySQL connection failed – check your .env password.

---

## Step 5 – Open the Frontend

### Option A – Served by Express (recommended)
Copy your `uniconnect-usiu-africa.html` into the `frontend/` folder,  
then open: **http://localhost:3000** in your browser.

### Option B – VSCode Live Server
1. Right-click `frontend/uniconnect-usiu-africa.html`
2. Click "Open with Live Server"
3. It opens at http://localhost:5500
4. Make sure .env has `FRONTEND_URL=http://localhost:5500`

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@usiu.ac.ke | password123 |
| Faculty | s.odhiambo@usiu.ac.ke | password123 |
| Student | j.mwangi@usiu.ac.ke | password123 |

---

## How It All Connects (The Flow)

```
┌─────────────────────────────────────────────────────────┐
│  BROWSER                                                │
│  uniconnect-usiu-africa.html                           │
│  + api.js (fetch calls)                                │
│                                                         │
│  doLogin() calls:                                       │
│  Auth.login(email, password)                           │
│       │                                                 │
│       │  POST http://localhost:3000/api/auth/login      │
│       │  Body: { email, password }                      │
└───────┼─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  EXPRESS SERVER  (backend/server.js)                    │
│                                                         │
│  → auth.routes.js → auth.controller.js                 │
│       │                                                 │
│       │  SELECT * FROM users WHERE email = ?            │
│       │  bcrypt.compare(password, hash)                 │
│       │  jwt.sign({ userId, role, profileId })          │
│       │                                                 │
│       │  Returns: { token, user }                       │
└───────┼─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  MySQL  (uniconnect_db)                                 │
│  tables: users, students, faculty, courses,             │
│          enrollments, grades, assignments, schedules    │
└─────────────────────────────────────────────────────────┘
        │
        │  JSON response back to browser
        ▼
┌─────────────────────────────────────────────────────────┐
│  BROWSER receives { token, user }                       │
│  → saves token to localStorage                         │
│  → every future request includes:                      │
│    Authorization: Bearer <token>                        │
│  → auth.middleware.js verifies token on every route    │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints Reference

### Auth
| Method | Endpoint | Who |
|--------|----------|-----|
| POST | /api/auth/login | Public |
| GET  | /api/auth/me    | Any logged-in user |

### Students
| Method | Endpoint | Who |
|--------|----------|-----|
| GET    | /api/students | Admin |
| POST   | /api/students | Admin |
| GET    | /api/students/:id | Admin / own student |
| PUT    | /api/students/:id | Admin / own student |
| GET    | /api/students/:id/grades | Admin / own student |
| GET    | /api/students/:id/courses | Admin / own student |
| POST   | /api/students/:id/enroll | Admin / own student |

### Courses
| Method | Endpoint | Who |
|--------|----------|-----|
| GET    | /api/courses | All |
| POST   | /api/courses | Admin |
| GET    | /api/courses/:id | All |
| PUT    | /api/courses/:id | Admin |
| GET    | /api/courses/:id/students | Admin / Faculty |
| GET    | /api/courses/:id/assignments | All |

### Faculty
| Method | Endpoint | Who |
|--------|----------|-----|
| GET    | /api/faculty | Admin |
| GET    | /api/faculty/:id/courses | Admin / own faculty |
| POST   | /api/faculty/:id/grades | Admin / own faculty |

### Reports
| Method | Endpoint | Who |
|--------|----------|-----|
| GET    | /api/reports/transcript/:studentId | Admin / own student |
| GET    | /api/reports/enrollment | Admin |
| GET    | /api/reports/gpa/:studentId | Admin / own student |

---

## Testing API Routes in VSCode

Install the **REST Client** extension, create a file `test.http`:

```http
### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "j.mwangi@usiu.ac.ke",
  "password": "password123"
}

### Get my courses (paste token from above)
GET http://localhost:3000/api/students/1/courses
Authorization: Bearer PASTE_TOKEN_HERE

### Get all courses
GET http://localhost:3000/api/courses

### Enrollment stats (admin token needed)
GET http://localhost:3000/api/reports/enrollment
Authorization: Bearer PASTE_ADMIN_TOKEN_HERE
```

Click **Send Request** above each block to test live.

---

## Folder Structure

```
uniconnect/
├── frontend/
│   ├── uniconnect-usiu-africa.html   ← your main UI
│   └── api.js                        ← all fetch() calls
├── backend/
│   ├── server.js                     ← Express entry point
│   ├── config/
│   │   └── db.js                     ← MySQL connection pool
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── course.routes.js
│   │   ├── faculty.routes.js
│   │   └── report.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── course.controller.js
│   │   ├── faculty.controller.js
│   │   └── report.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   └── utils/
│       └── gradeCalc.js
├── database/
│   ├── schema.sql                    ← run this first
│   └── seed.sql                      ← run this second
├── .env                              ← your DB password goes here
├── .gitignore
├── package.json
└── README.md
```

---

## Connecting the Frontend HTML to the Backend

Open `uniconnect-usiu-africa.html` and make these two changes:

**1. Add the api.js script tag (before closing `</body>`):**
```html
<script src="api.js"></script>
```

**2. Replace the demo `doLogin()` function with the real one:**
```javascript
async function doLogin() {
  const email    = document.getElementById('loginId').value;
  const password = document.getElementById('loginPass').value;

  try {
    const data = await Auth.login(email, password);
    currentUser = data.user;
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appShell').style.display  = 'block';
    initApp();
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
}
```

**3. Replace data fetches. Example – load real courses:**
```javascript
async function buildMyCourses(el) {
  try {
    const courses = await Students.getCourses(currentUser.profileId);
    // render courses array into el...
  } catch (err) {
    el.innerHTML = `<div class="alert alert-warning">⚠️ ${err.message}</div>`;
  }
}
```

Every function in `api.js` (Auth, Students, Courses, Faculty, Reports)  
maps directly to a backend route. Just replace the hardcoded arrays  
in the HTML with `await SomeModule.someMethod()` calls.

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `❌ MySQL connection failed` | Check DB_PASSWORD in .env matches MySQL |
| `CORS error` in browser | Make sure FRONTEND_URL in .env matches your browser URL |
| `Cannot find module 'express'` | Run `npm install` again |
| `ER_ACCESS_DENIED_ERROR` | Wrong MySQL username/password in .env |
| `jwt malformed` | Token is corrupted – clear localStorage and log in again |
| Port 3000 in use | Change PORT in .env to 3001 or kill the other process |
