'use strict';
/*eslint no-process-env:0*/

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.IP || undefined,

  // Server port
  port: process.env.PORT || 8080,

  db: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false,
    timezone: '+05:30',
    dialectOptions: {
      charset: 'utf8mb4',
    },
  },

  MINIO: {
    endPoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    secure: true,
    port: 443,
  },

  solr: {
    host: process.env.SOLR_HOST,
    port: process.env.SOLR_PORT,
    core: process.env.SOLR_CORE,
    path: process.env.SOLR_PATH,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    ignoreTLS: process.env.SMTP_IGNORETLS === 'true',
    auth: {
      user: process.env.SMTP_AUTH_USER,
      pass: process.env.SMTP_AUTH_PASS,
    },
  },

};
