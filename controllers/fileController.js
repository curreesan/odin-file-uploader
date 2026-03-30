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

// POST - Upload File with proper folder support
const uploadFile = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  if (!req.file) {
    return res.send('No file selected. <a href="/dashboard">Go back</a>');
  }

  const { folderId } = req.body;
  const file = req.file;

  try {
    let finalFolderId = null;
    let folderPath = `${req.user.id}`; // Default: under user ID

    // If folder is selected, use folder name in path
    if (folderId && folderId !== "") {
      const folder = await prisma.folder.findFirst({
        where: {
          id: parseInt(folderId),
          userId: req.user.id,
        },
      });

      if (folder) {
        finalFolderId = parseInt(folderId);
        folderPath = `${req.user.id}/${folder.name}`; // e.g., 4/My Projects
      }
    }

    // Create unique filename
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt);
    const uniqueFileName = `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

    const finalPath = `${folderPath}/${uniqueFileName}`;

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(finalPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.send(
        'Failed to upload file. <a href="/dashboard">Go back</a>',
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(finalPath);

    // Save to database
    await prisma.file.create({
      data: {
        name: uniqueFileName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: urlData.publicUrl,
        publicId: finalPath, // Full path - important for deletion
        folderId: finalFolderId,
        userId: req.user.id,
      },
    });

    console.log(`✅ Uploaded: ${finalPath}`);
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.send(
      'Something went wrong during upload. <a href="/dashboard">Go back</a>',
    );
  }
};

module.exports = { showUploadForm, uploadFile };
