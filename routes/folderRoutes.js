// routes/folderRoutes.js
const express = require("express");
const router = express.Router();
const {
  getDashboard,
  createFolder,
  deleteFolder,
  deleteFile,
} = require("../controllers/folderController");

router.get("/dashboard", getDashboard);
router.post("/folders", createFolder);
router.post("/folders/:id/delete", deleteFolder);
router.post("/files/:id/delete", deleteFile);

module.exports = router;
