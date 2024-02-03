const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/kanhasoft', 
console.log("DB Connected")
);

// Define File Schema
const fileSchema = new mongoose.Schema({
  file_name:{type:String} ,
  file_size: {type:Number},
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  deleted_at:{type:Date} ,
  updated_at: {type:Date}
});

const File = mongoose.model('File', fileSchema);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.is_deleted ? 'recycle' : 'active';
    const dir = `./uploads/${folder}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API to save a file
app.post('/api/saveFile', upload.single('file'), async (req, res) => {
  const { file } = req;
  const { file_name, file_size, is_deleted } = req.body;

  const newFile = new File({
    file_name,
    file_size,
    is_deleted,
    created_at: Date.now(),
    updated_at:Date.now()
  });

  try {
    await newFile.save();
    res.status(201).send({ message: 'File saved successfully', file });
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// API to get a list of files
app.get('/api/getFiles', async (req, res) => {
  try {
    const query = req.query.is_deleted === 'true' ? { is_deleted: true } : { is_deleted: false };
    const files = await File.find(query);
    res.status(200).send(files);
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// API to delete a file by ID
app.delete('/api/deleteFile/:id', async (req, res) => {
  const fileId = req.params.id;

  try {
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).send({ error: 'File not found' });
    }

    file.is_deleted = true;
    file.deleted_at = Date.now();
    await file.save();

    res.status(200).send({ message: 'File deleted successfully', file });
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// API to retrieve a file by ID
app.get('/api/retrieveFile/:id', async (req, res) => {
  const fileId = req.params.id;

  try {
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).send({ error: 'File not found' });
    }

    file.is_deleted = false;
    file.deleted_at = null;
    file.updated_at = Date.now();
    await file.save();

    res.status(200).send({ message: 'File retrieved successfully', file });
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
