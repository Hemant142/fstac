const express = require("express");
// const router = express.Router();
const AudioRecording = require("../Models/Recording");
const audioRouter = express.Router();
// Get all audio recordings
audioRouter.get("/", async (req, res) => {
  try {
    const audioRecordings = await AudioRecording.find();
    res.status(200).json(audioRecordings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new audio recording
audioRouter.post("/", async (req, res) => {
  const { name, url, duration } = req.body;
  const newRecording = new AudioRecording({
    name,
    url,
    duration,
  });

  try {
    const savedRecording = await newRecording.save();
    res.status(201).json(savedRecording);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an audio recording
audioRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const recording = await AudioRecording.findById(id);
    if (!recording) return res.status(404).json({ message: "Recording not found" });

    recording.name = name;
    const updatedRecording = await recording.save();
    res.json(updatedRecording);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an audio recording
audioRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await AudioRecording.findByIdAndDelete(id);
    res.json({ message: "Recording deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = audioRouter;
