var mongoose = require('mongoose');

var ResumeSchema = new mongoose.Schema({
  filename: String,
  score: Number,
  uploadedAt: Date,
  role: String
});

module.exports = mongoose.model('Resume', ResumeSchema);
