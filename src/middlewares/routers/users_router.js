const ApplicationUserRegistrationSchemaValidator = require('../schema_validators/application_user_registration_schema_validator.js');
const ApplicationUserCredentialsSchemaValidator = require('../schema_validators/application_user_credentials_schema_validator.js');
const ServerTokenAuthenticator = require('../../middlewares/authenticators/server_token_authenticator.js');
const PasswordAuthenticator = require('../authenticators/password_authenticator.js');
const UserController = require('../../controllers/user_controller.js');
const ServerController = require('../../controllers/server_controller.js');
const TokenResponseBuilder = require('../response_builders/token_response_builder.js');
const ApplicationUserResponseBuilder = require('../response_builders/application_user_response_builder.js');

function UsersRouter(app, logger, postgrePool) {
  let _applicationUserCredentialsSchemaValidator = new ApplicationUserCredentialsSchemaValidator(logger);
  let _applicationUserRegistrationSchemaValidator = new ApplicationUserRegistrationSchemaValidator(logger);
  let _serverTokenAuthenticator = new ServerTokenAuthenticator(logger, postgrePool);
  let _passwordAuthenticator = new PasswordAuthenticator(logger, postgrePool);
  let _userController = new UserController(logger, postgrePool);
  let _serverController = new ServerController(logger, postgrePool);
  let _tokenResponseBuilder = new TokenResponseBuilder(logger);
  let _userRegistrationResponseBuilder = new ApplicationUserResponseBuilder(logger);

  app.post('/api/token',
    _applicationUserCredentialsSchemaValidator.validateRequest,
    _serverTokenAuthenticator.authenticateFromHeader,
    _serverController.updateLastConnection,
    _passwordAuthenticator.authenticate,
    _userController.generateTokenForApplicationUser,
    _tokenResponseBuilder.buildResponse
  );

  app.post('/api/user',
    _applicationUserRegistrationSchemaValidator.validateRequest,
    _serverTokenAuthenticator.authenticateFromHeader,
    _serverController.updateLastConnection,
    _serverController.checkApplicationOwner,
    _userController.createUser,
    _userController.setOwnership,
    _userRegistrationResponseBuilder.buildResponse
  );

  app.post('/api/admin-user',
    _userController.createUser,
    _userController.generateTokenForAdminUser(),
    _userRegistrationResponseBuilder.buildResponse
  );
}


module.exports = UsersRouter;
