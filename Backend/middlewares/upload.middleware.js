const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    'application/pdf', // File PDF
    'image/jpeg',      // Ảnh JPG/JPEG
    'image/png',       // Ảnh PNG
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // File Word (.docx)
    'application/vnd.ms-excel' // File Excel (.xls)
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error('Only PDF, JPG, PNG, DOCX, and XLS files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } //10MB
});

module.exports = upload;