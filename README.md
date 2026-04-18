# EvalAI — Full Stack AI-Assisted Rubric Evaluation System

An intelligent web-based platform for evaluating student submissions (algorithms, pseudocode, flowchart steps) using Google Gemini AI against teacher-defined rubrics. 

Built with a **MERN-like architecture** (Vanilla JS Frontend, Node.js/Express Backend, MongoDB Database).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org) installed
- A MongoDB URI (if replacing the default)

### Setup & Run
1. Navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
4. The application and API will be available at `http://localhost:3000`

---

## 🤖 Enable Real AI Evaluation

1. Get a free **Gemini API Key** from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Login as **Admin** → go to **Settings**
3. Enter your API key and click **Save API Key**
4. Now all student submissions will be evaluated by **Gemini 2.0 Flash**!

---

## 📁 Architecture & File Structure

```
website/
├── server.js               ← Local Node.js / Express Dev Server
├── package.json            ← Dependencies
├── .env                    ← Environment variables (MongoDB URI)
├── api/
│   ├── index.js            ← Vercel serverless function entry / Express API Hub
│   └── models.js           ← Mongoose Database Schemas
├── js/
│   ├── auth.js             ← Session & Login Management 
│   ├── storage.js          ← MongoDB Fetch Calls (formerly LocalStorage)
│   └── evaluator.js        ← Gemini AI evaluation engine logic
├── index.html              ← Landing page / Login
├── student/                ← Student Dashboard portals
├── teacher/                ← Teacher Dashboard portals
├── admin/                  ← Admin Dashboard portals
└── css/                    ← Global Stylesheets
```

---

## 👥 User Roles

| Role    | Capabilities |
|---------|-------------|
| Student | Submit work, view automated AI evaluation results |
| Teacher | Create rubrics, assign to students, view system reports |
| Admin   | Manage all users, set API key, view telemetry, manage platforms |

---

## 🎨 Tech Stack

- **Frontend**: Pure HTML, Vanilla CSS, Vanilla JavaScript
- **Backend / API**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM)
- **AI Integration**: Google Gemini 2.0 Flash API (configurable)
- **Deployment Ready**: Fully configured for Vercel serverless hosting (`vercel.json` included)
