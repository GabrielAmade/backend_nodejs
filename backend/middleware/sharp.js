const fs = require("fs");
const sharp = require("sharp");

module.exports = async (req, res, next) => {
  const folderName = "./images/resized";
  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
  } catch (error) {
    console.log(error);
  }

  if (req.file) {
    const { originalname, filename, path } = req.file;
    const filenameWithoutExtension = originalname.split(".")[0];
    const uniquePrefix = Date.now();
    const newFilename = `${filenameWithoutExtension}_${uniquePrefix}.webp`;
    const resizedImagePath = `${folderName}/${newFilename}`;

    try {
      await sharp(path)
        .resize(500, 700)
        .toFormat("webp")
        .webp({ quality: 80 })
        .toFile(resizedImagePath);

      req.sharp = {
        imageUrl: `${req.protocol}://${req.get("host")}/images/resized/${newFilename}`,
      };

      fs.unlink(path, (err) => {
        if (err) throw err;
      });
    } catch (error) {
      console.log(error);
    }
  }

  next();
};