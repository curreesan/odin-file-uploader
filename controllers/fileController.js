const prisma = require("../prisma");
const upload = require("../config/multer");

// GET - Show upload form inside dashboard (or separate page)
const showUploadForm = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  // Fetch user's folders for the dropdown
  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    orderBy: { name: "asc" },
  });

  res.render("dashboard", {
    folders,
    showUploadForm: true, // use this flag in EJS
  });
};

// POST - Handle file upload
const uploadFile = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  if (!req.file) {
    return res.send(
      'No file selected or upload failed. <a href="/dashboard">Go back</a>',
    );
  }

  const { folderId } = req.body;

  try {
    let finalFolderId = null;

    // Validate folder if provided
    if (folderId && folderId !== "") {
      const folder = await prisma.folder.findFirst({
        where: {
          id: parseInt(folderId),
          userId: req.user.id,
        },
      });
      if (folder) finalFolderId = parseInt(folderId);
    }

    // Save file metadata using your existing File model
    await prisma.file.create({
      data: {
        name: req.file.filename, // saved filename
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: req.file.path.replace(/\\/g, "/"), // "uploads/filename-xxx.pdf"
        publicId: null,
        folderId: finalFolderId,
        userId: req.user.id,
      },
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Upload error:", error);
    res.send('Error saving file to database. <a href="/dashboard">Go back</a>');
  }
};

module.exports = { showUploadForm, uploadFile };
