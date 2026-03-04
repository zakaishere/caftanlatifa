import multer from 'multer';

// Use memory storage for processing directly to Cloudinary without writing to disk
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
