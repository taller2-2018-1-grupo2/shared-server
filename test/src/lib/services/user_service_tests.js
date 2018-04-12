const expect = require('expect.js');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const UserServiceModule = '../../../../src/lib/services/user_service.js';

const mockLogger = {
  info: sinon.stub(),
  error: sinon.stub(),
};

const mockUserModel = {
  findByUsername: sinon.stub(),
  update: sinon.stub(),
};

const mockTokenGenerationService = {
  generateToken: sinon.stub(),
  validateToken: sinon.stub(),
};

const mockDigest = sinon.stub();

const mockCrypto = {
  createHmac: function() {
    return {
      update: function() {
        return {
          digest: mockDigest,
        };
      },
    };
  },
};

function setupUserService() {
  let mocks = {
    'crypto': mockCrypto,
    '../../models/user_model.js': function() {
 return mockUserModel;
},
    './token_generation_service': function() {
 return mockTokenGenerationService;
},
  };
  let UserService = proxyquire(UserServiceModule, mocks);
  return new UserService(mockLogger);
}


describe('UserService Tests', function() {
  let userService;

  before(function() {
    userService = setupUserService();
  });

  describe('#generateToken', function() {
    describe('user found', function() {
      describe('user has token', function() {
        before(function() {
          mockUserModel.findByUsername.callsArgWith(1, null, { username: 'username', password: 'password', token: 'token' });
        });

        describe('token valid', function() {
          before(function() {
            mockTokenGenerationService.validateToken.callsArgWith(2);
          });

          it('does not return error', function(done) {
            userService.generateToken('username', function(err) {
              expect(err).to.be.null;
              done();
            });
          });
        });

        describe('token invalid', function() {
          before(function() {
            mockTokenGenerationService.validateToken.callsArgWith(2, 'token invalid');
            mockTokenGenerationService.generateToken.callsArgWith(1, 'token');
          });

          it('does not return error', function(done) {
            userService.generateToken('username', function(err) {
              expect(err).to.be.null;
              done();
            });
          });
        });
      });

      describe('user does not have token', function() {
        before(function() {
          mockUserModel.findByUsername.callsArgWith(1, null, { username: 'username', password: 'password' });
          mockTokenGenerationService.generateToken.callsArgWith(1, 'token');
        });

        it('does not return error', function(done) {
          userService.generateToken('username', function(err) {
            expect(err).to.be.null;
            done();
          });
        });
      });
    });

    describe('user not found', function() {
      before(function() {
        mockUserModel.findByUsername.callsArgWith(1, 'user not found');
      });

      it('returns error', function(done) {
        userService.generateToken('username', function(err) {
          expect(err).to.be.ok();
          done();
        });
      });
    });
  });

  describe('#authenticateWithPassword', function() {
    describe('user found', function() {
      before(function() {
        mockUserModel.findByUsername.callsArgWith(1, null, { username: 'username', password: 'password' });
      });

      describe('valid password', function() {
        before(function() {
          mockDigest.returns('password');
        });

        it('does not return error', function(done) {
          userService.authenticateWithPassword('username', 'password', function(err) {
            expect(err).to.be.null;
            done();
          });
        });
      });

      describe('invalid password', function() {
        before(function() {
          mockDigest.returns('another_hash');
        });

        it('returns error', function(done) {
          userService.authenticateWithPassword('username', 'password', function(err) {
            expect(err).to.be.ok();
            done();
          });
        });
      });
    });

    describe('user not found', function() {
      before(function() {
        mockUserModel.findByUsername.callsArgWith(1, 'user not found');
      });

      it('returns error', function(done) {
        userService.authenticateWithPassword('username', 'password', function(err) {
          expect(err).to.be.ok();
          done();
        });
      });
    });
  });
});
