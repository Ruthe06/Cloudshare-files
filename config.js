module.exports = {
  PORT: process.env.PORT || 3000,
  CORS_ORIGIN: '*',
  TEMP_DIR: './temp',
  UPLOAD_DIR: './uploads',
  LOG_DIR: './logs',
  MAX_BUFFER_SIZE: 2 * 1024 * 1024,
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,
  CHUNK_SIZE: 10 * 1024 * 1024,
  CLEANUP_INTERVAL: 60 * 60 * 1000
};
