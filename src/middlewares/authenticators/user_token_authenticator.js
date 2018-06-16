const UserTokenService = require('../../lib/services/user_token_service.js');
const BaseHttpError = require('../../errors/base_http_error.js');

function UserTokenAuthenticator(logger, postgrePool) {
  let _userTokenService = new UserTokenService(logger, postgrePool);

  function getTokenFromHeader(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else return null;
  }

  function getTokenFromQuerystring(req) {
    if (req.query && req.query.token) {
      return req.query.token;
    } else return null;
  }

  async function authenticate(token, next) {
    if (token) {
      try {
        await _userTokenService.validateToken(token);
        return next();
      } catch (err) {
        let error = new BaseHttpError('Unauthorized', 401);
        return next(error);
      }
    } else {
      let error = new BaseHttpError('Unauthorized', 401);
      return next(error);
    }
  }

  this.authenticateFromHeader = async (req, res, next) => {
    let token = getTokenFromHeader(req);
    await authenticate(token, next);
  };

  this.authenticateFromQuerystring = async (req, res, next) => {
    let token = getTokenFromQuerystring(req);
    await authenticate(token, next);
  };
}

module.exports = UserTokenAuthenticator;
