const UserTokenModel = require('../../models/user_token_model.js');

function UserTokenService(logger, postgrePool, tokenGenerationService) {
  let _logger = logger;
  let _userTokenModel = new UserTokenModel(logger, postgrePool);
  let _tokenGenerationService = tokenGenerationService;

  async function generateNewTokenForUser(user) {
    let token = await _tokenGenerationService.generateToken(user);
    await _userTokenModel.createOrUpdate(user, token);
    let userToken = {
      token: token.token,
      tokenExpiration: token.expiresAt,
    };
    return userToken;
  }

  this.generateToken = async (user) => {
    let userToken = await _userTokenModel.findByUser(user);
    if (userToken) {
      try {
        let validatedToken = await _tokenGenerationService.validateToken(userToken.token, user);
        _logger.info('User: \'%s\' already has a valid token, skipping token generation', user.username);
        let businessToken = {
          token: validatedToken.token,
          tokenExpiration: validatedToken.expiresAt,
        };
        return businessToken;
      } catch (err) {
        _logger.info('User: \'%s\' already has a token but it is not valid, generating new token', user.username);
        return await generateNewTokenForUser(user);
      }
    } else {
      _logger.info('User: \'%s\' does not have a token, generating one', user.username);
      return await generateNewTokenForUser(user);
    }
  };

  this.validateToken = async (token) => {
    let userId = await _tokenGenerationService.getUserIdFromToken(token);
    let userToken = await _userTokenModel.findByUserId(userId);
    if (token === userToken.token) {
      if (_tokenGenerationService.validatePermissions(token)) {
        _logger.info('Token was validated successfully for user_id:\'%s\'', userId);
        return userId;
      } else {
        _logger.error('Token does not have the required permissions');
      }
    } else {
      _logger.debug('Token was created for user_id:\'%s\' but does not match the token saved in the database for that user', userId);
      _logger.error('Token contains inconsistent data');
    }
    return null;
  };
}

module.exports = UserTokenService;
