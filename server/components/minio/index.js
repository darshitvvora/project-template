/*
* Purpose: Used to connect to minio and perform operations on it.
* MinIO is a high performance object storage server compatible with Amazon S3 APIs
* Usage:
* const Minio = require('../components/Minio')
  async uploadFile(fileObj) {
        if (!fileObj || !fileObj.file) return fileObj;

        const {
          file: { base64: base64String, filename },
          start_date: startDate,
          end_date: endDate,
        } = fileObj;
        const extension = filename.split('.').pop();
        const objName = moment().format('YYYY_MM_DD_hh_mm_ss_a');
        const object = `folderParent/${objName}.${extension}`;
        await Minio.base64Upload({ object, base64String });
        return object;
      },
  async downloadFile(path) {
    const extension = path ? path.split('.').pop() : 'pdf';
    const minioObject = {
      object: path,
      name: `FileName_${moment().format('DD-MM-YY')}.${extension}`,
    };
    return Minio.downloadLink(minioObject);
  },
* */

const fsp = require('fs-promise');
const MinioClient = require('minio');
const Bluebird = require('bluebird');
const config = require('../../config/environment');
const logger = require('../logger');

// Todo: Need better structure
const Minio = new MinioClient(config.MINIO);
Bluebird.promisifyAll(Object.getPrototypeOf(Minio));
// - Todo: Move to Helpers
Minio.bufferUpload = (minioObject) => {
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercaseObj
  return Minio.putObjectAsync(minObj.bucket, minObj.object,
    minObj.buffer, 'application/octet-stream');
};

function qualifyBucket(bucketName) {
  let bucket = bucketName;
  if (typeof bucket === 'string' && bucket[0] === '/') {
    bucket = bucket.slice(1);
  }
  return bucket.toLowerCase();
}

Minio.base64Upload = (minioObject) => {
  const minObj = minioObject;
  minObj.buffer = Buffer.from(minioObject.base64String, 'base64');
  return Minio.bufferUpload(minObj);
};

Minio.base64UploadMulti = minioObjects => Promise.all(minioObjects.map(m => Minio.base64Upload(m)));

Minio.viewLink = (minioObject, QDMSCompat = true) => {
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercaseObj
  minObj.expires = minObj.expires || 24 * 60 * 60; // Expired in one day
  if (!minObj.object) {
    logger.error('Minio: View File not found', minObj);
    return Promise.resolve(`${config.PREFIX}api.${config.DOMAIN}/api/404.pdf`);
  }
  return Minio.statObjectAsync(
    minObj.bucket,
    QDMSCompat
      ? qualifyBucket(minObj.object)
      : minObj.object)
    .then(() => Minio
      .presignedGetObjectAsync(minObj.bucket,
        QDMSCompat
          ? qualifyBucket(minObj.object)
          : minObj.object, minObj.expires))
    .catch(() => {
      logger.error('Minio: View File not found', minObj);
      return `${config.PREFIX}api.${config.DOMAIN}/api/404.pdf`;
    });
};

Minio.listDirectoryObjects = async (minioObject) => {
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercaseObj
  if (!minObj.object) {
    logger.error('Minio: View Folder not found', minObj);
    return Promise.resolve(`${config.PREFIX}api.${config.DOMAIN}/api/404.pdf`);
  }

  return new Promise((res, rej) => {
    const objectsStream = Minio.listObjects(minObj.bucket, qualifyBucket(minObj.object), false);
    const data = [];
    objectsStream.on('data', (obj) => {
      data.push(obj);
    });
    objectsStream.on('error', (e) => {
      rej(e);
    });
    objectsStream.on('end', () => {
      res(data);
    });
  });
};

Minio.downloadLinkBase = (minioObject) => {
  if (!minioObject.name) return logger.error('File Name required for download');
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercaseObj
  minObj.expires = minObj.expires || 24 * 60 * 60; // Expired in one day
  minObj.headers = {
    'response-content-disposition':
      `attachment; filename="${minObj.name.replace(/[^a-zA-Z0-9-_.]/g, '')}"` };
  return Minio.presignedGetObjectAsync(
    minObj.bucket.toLowerCase(), minObj.object,
    minObj.expires, minObj.headers,
  );
};

Minio.agreementCompat = function agreementCompat(filePath) {
  return (filePath || '').replace('/home/gloryque/QDMS/', '');
};

Minio.downloadLink = (minioObject, qualify = false) => {
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercase
  return Minio
    .statObjectAsync(minObj.bucket, qualify
      ? qualifyBucket(minObj.object)
      : minObj.object)
    .then(() => Minio.downloadLinkBase(minObj))
    .catch((err) => {
      logger.error('Minio: File not found', minObj, err);
      return `${config.PREFIX}api.${config.DOMAIN}/api/404.pdf`;
    });
};

Minio.retryDownloadLink = (minioObject) => {
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercase
  return Minio.statObjectAsync(minObj.bucket, qualifyBucket(minObj.object))
    .then(() => Minio.downloadLinkBase(minObj))
    .catch((e) => {
      logger.error('Minio: retry', minObj, e);
      return Minio.statObjectAsync(minObj.bucket, qualifyBucket(minObj.retryObject))
        .then(() => {
          minObj.object = minObj.retryObject;
          return Minio.downloadLink(minObj);
        })
        .catch((err) => {
          logger.error('Minio: File not found', minObj, err);
          return `${config.PREFIX}api.${config.DOMAIN}/api/404.pdf`;
        });
    });
};

Minio.uploadLink = (minioObject) => {
  const minObj = minioObject;
  minObj.bucket = minObj.bucket || 'myBucket'; // Bucket name always in lowercaseObj
  minObj.expires = minObj.expires || 24 * 60 * 60; // Expired in one day
  return Minio.presignedPutObjectAsync(minObj.bucket, qualifyBucket(minObj.object), minObj.expires);
};

Minio.uploadTemp = (minioObject) => {
  const minObj = minioObject;
  const fileStream = fsp.createReadStream(minioObject.temp);
  return fsp.stat(minioObject.temp).then(stats => Minio
    .putObjectAsync('myBucket', minObj.object, fileStream, stats.size, 'application/octet-stream'));
};

Minio.getFileStream = minioObject => new Promise(((resolve, reject) => {
  Minio.getObject(minioObject.bucket || 'myBucket', minioObject.object,
    (err, stream) => {
      if (err) return reject(err);
      return resolve(stream);
    },
  );
}));

module.exports = Minio;

