const upload = require("../middlewares/upload-middleware");
const util = require("util");
const fs = require("fs");
const crypto = require('crypto');

exports.index = (req, res) => {
    return res.render('index', { message: req.flash() });
}

exports.upload = (req, res) => {
  try {
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const hash = crypto.createHash('sha256');
      const finalHex = hash.update(fileBuffer).digest('hex');

      return res.json({
        erro: false,
        path: req.file.path,
        file: req.file.filename,
        hash_file: finalHex
      });
    }
  } catch (e) {
    console.error(e)
  }
}