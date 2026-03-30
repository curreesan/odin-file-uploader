// config/multer.js
const multer = require("multer");

// Use memory storage because we will upload directly to Supabase
const upload = multer({
  storage: multer.memoryStorage(), // File stays in RAM (buffer)
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images, PDF and document files are allowed"), false);
    }
  },
});

module.exports = upload;
