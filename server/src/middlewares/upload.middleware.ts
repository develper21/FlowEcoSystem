import multer from 'multer';

const storage = multer.memoryStorage();

// Avatar upload (images only)
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// Attachment upload (images + PDFs)
export const uploadAttachment = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for attachments
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            'image/png',
            'image/jpg',
            'image/jpeg',
            'image/webp',
            'image/gif',
            'application/pdf'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images (PNG, JPG, JPEG, WEBP, GIF) and PDF files are allowed'));
        }
    },
});
