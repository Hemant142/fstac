const mongoose = require("mongoose");

const audioRecordingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  url: {
    type: String,
    required: true,
  },
});

const AudioRecording = mongoose.model("AudioRecording", audioRecordingSchema);

module.exports = AudioRecording;
