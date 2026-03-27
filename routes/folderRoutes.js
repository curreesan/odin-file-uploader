const express = require("express");
const router = express.Router();
const {
  getDashboard,
  createFolder,
  deleteFolder,
} = require("../controllers/folderController");

router.get("/dashboard", getDashboard);
router.post("/folders", createFolder);
router.post("/folders/:id/delete", deleteFolder);

module.exports = router;
