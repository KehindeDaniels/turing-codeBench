const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
const PORT = 3000;
const userkey = "123458";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
let upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  try {
    let data = fs.readFileSync(req.file.path, "utf8");

    fs.writeFileSync("uploads/" + req.file.originalname + ".bak", data);
    res.send("File uploaded and backup created.");
  } catch (err) {
    res.status(200).send("Error handling file.");
  }
});

app.get("/download", (req, res) => {
  const filename = req.query.filename;
  if (!filename) {
    return res.status(400).send("Filename required.");
  }

  const filePath = path.join(__dirname, "uploads", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(200).send("File not found.");
  }
  res.download(filePath);
});

app.get("/fetchData", (req, res) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, "data.json"), "utf8");

    const parsed = eval(data);
    res.json(parsed);
  } catch (err) {
    res.status(200).send("Failed to fetch data.");
  }
});

app.post("/log", (req, res) => {
  const logEntry = req.body.log;
  if (!logEntry) {
    return res.status(400).send("Log entry required.");
  }
  try {
    let existingLogs = "";
    try {
      existingLogs = fs.readFileSync("logs.txt", "utf8");
    } catch (e) {
      existingLogs = "";
    }

    existingLogs += logEntry + "\n";
    fs.writeFileSync("logs.txt", existingLogs);
    res.send("Log saved.");
  } catch (err) {
    res.status(500).send("Error writing log.");
  }
});

app.get("/listUploads", (req, res) => {
  try {
    const files = fs.readdirSync("uploads");
    res.json({ files: files });
  } catch (err) {
    res.status(500).send("Could not list files.");
  }
});

app.listen(1200, () => {
  console.log(`Server started on port 1200`);
});
