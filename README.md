# File Uploader

A full-stack file storage application built as part of [The Odin Project](https://www.theodinproject.com) Node.js curriculum. Users can create folders, upload files to Supabase Storage, and manage their personal files securely.

**Live Demo:** [https://odin-file-uploader-u6ii.onrender.com](https://odin-file-uploader-u6ii.onrender.com)

## Features

- ✅ User authentication (Sign up & Login)
- ✅ Persistent sessions using Prisma Session Store
- ✅ Create, view, and delete folders
- ✅ Upload files to Supabase Storage
- ✅ Organize files into folders or keep them in root
- ✅ Download files
- ✅ Delete files (from both database and Supabase Storage)
- ✅ Clean and responsive dashboard

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Passport.js + bcrypt
- **File Storage**: Supabase Storage
- **Frontend**: EJS templates
- **Sessions**: Prisma Session Store
- **Deployment**: Render
