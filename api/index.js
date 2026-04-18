const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { User, Rubric, Assignment, Submission, Result } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Maintain database connection across lambda invocations
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  const dbUri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!dbUri) {
     console.error("No database URL provided in environment (MONGO_URI).");
     return;
  }
  await mongoose.connect(dbUri);
  isConnected = true;
};

// Global DB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ** Users & Auth **
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ ok: false, error: 'No account found with that email.' });
  if (user.password !== password) return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  res.json({ ok: true, user: { userId: user.id, role: user.role, name: user.name, email: user.email }});
});

app.get('/api/users', async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter);
  res.json(users);
});

app.get('/api/users/:id', async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  res.json(user || null);
});

app.post('/api/users', async (req, res) => {
  const id = req.body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  const user = new User({ ...req.body, id });
  await user.save();
  res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
  const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  await User.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// ** Rubrics **
app.get('/api/rubrics', async (req, res) => {
  const { teacherId } = req.query;
  const filter = teacherId ? { teacherId } : {};
  const rubrics = await Rubric.find(filter);
  res.json(rubrics);
});

app.get('/api/rubrics/:id', async (req, res) => {
  const rubric = await Rubric.findOne({ id: req.params.id });
  res.json(rubric || null);
});

app.post('/api/rubrics', async (req, res) => {
  const id = req.body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  const rubric = new Rubric({ ...req.body, id });
  await rubric.save();
  res.json(rubric);
});

app.put('/api/rubrics/:id', async (req, res) => {
  const rubric = await Rubric.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(rubric);
});

app.delete('/api/rubrics/:id', async (req, res) => {
  await Rubric.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// ** Assignments **
app.get('/api/assignments', async (req, res) => {
  const { teacherId, studentId } = req.query;
  let filter = {};
  if (teacherId) filter.teacherId = teacherId;
  if (studentId) filter.assignedTo = studentId;
  const assignments = await Assignment.find(filter);
  res.json(assignments);
});

app.get('/api/assignments/:id', async (req, res) => {
  const assignment = await Assignment.findOne({ id: req.params.id });
  res.json(assignment || null);
});

app.post('/api/assignments', async (req, res) => {
  const id = req.body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  const assignment = new Assignment({ ...req.body, id });
  await assignment.save();
  res.json(assignment);
});

app.put('/api/assignments/:id', async (req, res) => {
  const assignment = await Assignment.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(assignment);
});

app.delete('/api/assignments/:id', async (req, res) => {
  await Assignment.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// ** Submissions **
app.get('/api/submissions', async (req, res) => {
  const { studentId, assignmentId } = req.query;
  let filter = {};
  if (studentId) filter.studentId = studentId;
  if (assignmentId) filter.assignmentId = assignmentId;
  const submissions = await Submission.find(filter);
  res.json(submissions);
});

app.get('/api/submissions/:id', async (req, res) => {
  const submission = await Submission.findOne({ id: req.params.id });
  res.json(submission || null);
});

app.post('/api/submissions', async (req, res) => {
  const id = req.body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  const submission = new Submission({ ...req.body, id, submittedAt: new Date(), status: 'pending' });
  await submission.save();
  res.json(submission);
});

app.put('/api/submissions/:id', async (req, res) => {
  const submission = await Submission.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(submission);
});

// ** Results **
app.get('/api/results', async (req, res) => {
  const { submissionId, studentId } = req.query;
  let filter = {};
  if (submissionId) filter.submissionId = submissionId;
  if (studentId) filter.studentId = studentId;
  const results = await Result.find(filter);
  res.json(results);
});

app.get('/api/results/:id', async (req, res) => {
  const result = await Result.findOne({ id: req.params.id });
  res.json(result || null);
});

app.post('/api/results', async (req, res) => {
  const id = req.body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  const result = new Result({ ...req.body, id, evaluatedAt: new Date() });
  await result.save();
  res.json(result);
});

module.exports = app;

