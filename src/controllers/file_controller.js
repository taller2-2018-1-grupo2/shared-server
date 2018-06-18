const fs = require('fs');
const multer = require('multer');
const config = require('config');
const FileService = require('../lib/services/file_service.js');
const BaseHttpError = require('../errors/base_http_error.js');

function FileController(logger, postgrePool) {
  let _logger = logger;
  let _fileService = new FileService(logger, postgrePool);

  this.createFileFromJson = async (req, res, next) => {
    let fileDataToCreate = {
      encodedFile: req.body.file,
      name: req.body.metadata.name,
    };
    let fileUploaded;
    try {
      fileUploaded = await _fileService.createFileAndUpload(fileDataToCreate);
    } catch (err) {
      _logger.error('An error occurred while creating the file');
      return next(err);
    }
    res.file = fileUploaded;
    return next();
  };

  this.createFileFromMultipart = async (req, res, next) => {
    let filesDirectory = config.TEMP_FILES_DIRECTORY;
    if (!fs.existsSync(filesDirectory)) {
      fs.mkdirSync('temp');
      fs.mkdirSync(filesDirectory);
    }
    let storageOpts = multer.diskStorage({
      destination: (req, file, cb) => cb(null, filesDirectory),
      filename: (req, file, cb) => cb(null, Date.now() + file.originalname),
    });
    let upload = multer({ storage: storageOpts });
    upload.single('file')(req, res, async (err) => {
      if (err) next(err);
      else {
        let fileUploaded;
        try {
          fileUploaded = await _fileService.loadFileAndUpload(req.file.path);
        } catch (err) {
          _logger.error('An error occurred while creating the file');
          return next(err);
        }
        res.file = fileUploaded;
        return next();
      }
    });
  };

  async function updateFile(res, next, fileDataToUpdate) {
    let fileModified;
    try {
      fileModified = await _fileService.updateFile(fileDataToUpdate);
    } catch (err) {
      _logger.error('An error occurred while updating the file');
      return next(err);
    }
    res.file = fileModified;
    return next();
  }

  this.updateFile = async (req, res, next) => {
    let fileDataToUpdate = {
      id: req.params.fileId,
      filename: req.body.filename,
      _rev: req.body._rev,
      size: req.body.size,
      resource: req.body.resource,
    };
    return await updateFile(res, next, fileDataToUpdate);
  };

  this.findFile = async (req, res, next) => {
    let fileFound;
    try {
      fileFound = await _fileService.findFile(req.params.fileId);
    } catch (err) {
      _logger.error('An error occurred while finding file with id: %s', req.params.fileId);
      return next(err);
    }
    res.file = fileFound;
    return next();
  };

  this.findServerFiles = async (req, res, next) => {
    let filesFound;
    try {
      filesFound = await _fileService.findServerFiles(res.serverAuthenticated.id);
    } catch (err) {
      _logger.error('An error occurred while finding the files of server_id: %s', res.serverAuthenticated.id);
      return next(err);
    }
    res.files = filesFound;
    return next();
  };

  this.assignOwnership = async (req, res, next) => {
    let fileDataToUpdate = {
      id: req.params.fileId,
      filename: req.body.filename,
      _rev: req.body._rev,
      size: req.body.size,
      resource: req.body.resource,
      owner: res.serverAuthenticated.id,
    };
    return await updateFile(res, next, fileDataToUpdate);
  };

  this.checkOwnership = async (req, res, next) => {
    let fileToCheck = res.file;
    let serverToCheck = res.serverAuthenticated;
    if (fileToCheck.owner === serverToCheck.id) {
      return next();
    } else {
      let error = new BaseHttpError('Server does not have access to the file', 401);
      return next(error);
    }
  };
}

module.exports = FileController;
