const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { showUploadForm, uploadFile } = require("../controllers/fileController");

router.get("/upload", showUploadForm);
router.post("/upload", upload.single("file"), uploadFile);

module.exports = router;
