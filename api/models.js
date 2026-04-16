const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true }, // admin, teacher, student
  createdAt: { type: Date, default: Date.now }
});

const CriterionSchema = new Schema({
  id: { type: String },
  name: { type: String },
  marks: { type: Number },
  description: { type: String }
});

const RubricSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  teacherId: { type: String, required: true },
  totalMarks: { type: Number },
  createdAt: { type: Date, default: Date.now },
  criteria: [CriterionSchema]
});

const AssignmentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  rubricId: { type: String, required: true },
  title: { type: String, required: true },
  dueDate: { type: String },
  teacherId: { type: String, required: true },
  assignedTo: [String],
  createdAt: { type: Date, default: Date.now }
});

const SubmissionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  assignmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  content: { type: Schema.Types.Mixed }, // to support complex payload (files, text, image analysis)
  status: { type: String, default: 'pending' },
  submittedAt: { type: Date, default: Date.now }
});

const ResultSchema = new Schema({
  id: { type: String, required: true, unique: true },
  submissionId: { type: String, required: true },
  studentId: { type: String, required: true },
  assignmentId: { type: String }, // optional denormalization
  score: { type: Number },
  feedback: { type: Schema.Types.Mixed }, // structured feedback payload
  evaluatedAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Rubric: mongoose.model('Rubric', RubricSchema),
  Assignment: mongoose.model('Assignment', AssignmentSchema),
  Submission: mongoose.model('Submission', SubmissionSchema),
  Result: mongoose.model('Result', ResultSchema)
};
