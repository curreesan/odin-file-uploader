const prisma = require("../prisma");

const getDashboard = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  // Get user's folders
  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    orderBy: { name: "asc" },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Get root files (files with no folder)
  const rootFiles = await prisma.file.findMany({
    where: {
      userId: req.user.id,
      folderId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  res.render("dashboard", {
    folders,
    rootFiles,
    showUploadForm: false,
  });
};

const createFolder = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.send(
      'Folder name cannot be empty. <a href="/dashboard">Go back</a>',
    );
  }

  try {
    await prisma.folder.create({
      data: {
        name: name.trim(),
        userId: req.user.id,
      },
    });
    res.redirect("/dashboard");
  } catch (error) {
    if (error.code === "P2002") {
      return res.send(
        `Folder "${name}" already exists. <a href="/dashboard">Go back</a>`,
      );
    }
    console.error(error);
    res.send('Error creating folder. <a href="/dashboard">Go back</a>');
  }
};

const deleteFolder = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const folderId = parseInt(req.params.id);

  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== req.user.id) {
      return res.send(
        'Folder not found or you do not have permission. <a href="/dashboard">Go back</a>',
      );
    }

    await prisma.folder.delete({
      where: { id: folderId },
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.send('Error deleting folder. <a href="/dashboard">Go back</a>');
  }
};

// Add this function
const deleteFile = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const fileId = parseInt(req.params.id);

  try {
    // Security check: file must belong to user
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== req.user.id) {
      return res.send(
        'File not found or you do not have permission. <a href="/dashboard">Go back</a>',
      );
    }

    // delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.send('Error deleting file. <a href="/dashboard">Go back</a>');
  }
};

module.exports = { getDashboard, createFolder, deleteFolder, deleteFile };
