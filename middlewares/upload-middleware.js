const multer = require('multer');
const path = require('path');

module.exports = (multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './contracts')
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        }
    }),
    fileFilter : (req, file, cb) => {
        // Verifica a extensão do arquivo
        const ext = path.extname(file.originalname);
        if (ext === '.sol') {
          cb(null, true); // Aceita o arquivo
        } else {
          cb(new Error('Apenas arquivos .sol são permitidos'), false); // Rejeita o arquivo
        }
    }
}));