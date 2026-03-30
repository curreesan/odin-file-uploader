// controllers/fileController.js
const prisma = require("../prisma");
const upload = require("../config/multer");
const supabase = require("../config/supabase");
const path = require("path");

const BUCKET_NAME = "file-uploads";

// GET - Show upload form
const showUploadForm = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    orderBy: { name: "asc" },
  });

  res.render("dashboard", {
    folders,
    showUploadForm: true,
  });
};

const uploadFile = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  if (!req.file) {
    return res.send('No file selected. <a href="/dashboard">Go back</a>');
  }

  const file = req.file;
  const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;

  try {
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt);
    const uniqueFileName = `${baseName}-${Date.now()}${fileExt}`;
    const finalPath = `${req.user.id}/${uniqueFileName}`;

    console.log("Uploading to:", finalPath);

    const { error } = await supabase.storage
      .from("file-uploads")
      .upload(finalPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.send(
        `Upload failed: ${error.message} <br><a href="/dashboard">Go back</a>`,
      );
    }

    const { data: urlData } = supabase.storage
      .from("file-uploads")
      .getPublicUrl(finalPath);

    await prisma.file.create({
      data: {
        name: uniqueFileName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: urlData.publicUrl,
        publicId: finalPath,
        folderId: folderId,
        userId: req.user.id,
      },
    });

    console.log("✅ Upload successful!");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error:", error);
    res.send(`Error: ${error.message} <br><a href="/dashboard">Go back</a>`);
  }
};

module.exports = { showUploadForm, uploadFile };
