import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import multerS3 from "multer-s3";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadPicture = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    //   acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      //cb(null, Date.now().toString() + path.extname(file.originalname));
      const userId = req.oidc.user.sub || "unknown_user";
      const filename = `${"user_picture"}/${userId}-${Date.now().toString()}${path.extname(
        file.originalname
      )}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    fieldSize: 25 * 1024 * 1024,
  },
});

const uploadIcon = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    //   acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      //cb(null, Date.now().toString() + path.extname(file.originalname));
      const userId = req.oidc.user.sub || "unknown_user";
      const filename = `${"icon_picture"}/${userId}-${Date.now().toString()}${path.extname(
        file.originalname
      )}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    fieldSize: 25 * 1024 * 1024,
  },
});

const isFileAvailableInAwsBucket = async (fileName) => {
  return true;
};

const getFileUrlFromAws = async (fileName, expireTime = null) => {
  try {
    const check = await isFileAvailableInAwsBucket(fileName);

    if (check) {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: fileName,
        ResponseContentDisposition: "inline",
        ResponseContentType: "image/jpeg",
      });

      const url =
        expireTime != null
          ? await getSignedUrl(s3, command, { expiresIn: expireTime })
          : await getSignedUrl(s3, command);

      return url;
    } else {
      return "error";
    }
  } catch (err) {
    console.log("error ::", err);
    return "error";
  }
};

const deleteFileFromAws = async (fileName) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
    });
    await s3.send(command);
  } catch (err) {
    console.error("Erro ao excluir arquivo:", err);
    throw new Error("Erro ao excluir arquivo");
  }
};

export { uploadPicture, uploadIcon, getFileUrlFromAws, deleteFileFromAws };
