# EvalAI — AI-Assisted Rubric Evaluation System

An intelligent web-based platform for evaluating student submissions (algorithms, pseudocode, flowchart steps) using Google Gemini AI against teacher-defined rubrics.

---

## 🚀 Quick Start

1. Open `index.html` in any modern browser (Chrome / Edge recommended)
2. Use demo credentials to explore:
   - **Student:** `student@eval.ai` / `student123`
   - **Teacher:** `teacher@eval.ai` / `teacher123`
   - **Admin:** `admin@eval.ai` / `admin123`

---

## 🤖 Enable Real AI Evaluation

1. Get a free **Gemini API Key** from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Login as **Admin** → go to **Settings**
3. Enter your API key and click **Save API Key**
4. Now all student submissions will be evaluated by **Gemini 2.0 Flash**

Without an API key, the system uses a **mock evaluator** (keyword-based heuristics) which is clearly labeled in results.

---

## 📁 File Structure

```
website/
├── index.html              ← Login / Landing page
├── css/
│   └── styles.css          ← Global design system
├── js/
│   ├── storage.js          ← LocalStorage data layer + seed data
│   ├── auth.js             ← Session management + UI helpers
│   └── evaluator.js        ← Gemini AI evaluation engine
├── student/
│   └── index.html          ← Student portal
├── teacher/
│   └── index.html          ← Teacher portal
├── admin/
│   └── index.html          ← Admin control panel
└── evaluation/
    └── result.html         ← Printable result view
```

---

## 👥 User Roles

| Role    | Capabilities |
|---------|-------------|
| Student | Submit work, view AI evaluation results |
| Teacher | Create rubrics, assign to students, view reports |
| Admin   | Manage all users, set API key, view system data, export |

---

## 📝 How Evaluation Works

1. Teacher creates a **rubric** with criteria and marks
2. Teacher creates an **assignment** (links rubric → students)
3. Student submits work as **structured text** (numbered steps)
4. System sends submission + rubric to **Gemini AI**
5. AI evaluates each criterion and generates feedback
6. Student views **criterion-by-criterion results** with strengths, weaknesses, suggestions

---

## ⚠️ Important Notes

- **No backend** — all data stored in browser localStorage (per-device)
- **Flowcharts** must be written as text steps (AI cannot read images)
- Data persists across browser sessions but NOT across different browsers/devices
- Use **Admin → Export Data** to backup your data as JSON

---

## 🎨 Tech Stack

- Pure HTML + Vanilla CSS + Vanilla JavaScript
- Google Gemini 2.0 Flash API (optional)
- Google Fonts (Inter + JetBrains Mono)
- No frameworks, no build step required
