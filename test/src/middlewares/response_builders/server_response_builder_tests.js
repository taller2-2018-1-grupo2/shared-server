const expect = require('expect.js');
const sinon = require('sinon');
const ServerResponseBuilder = require('../../../../src/middlewares/response_builders/server_response_builder.js');

const mockLogger = {
  debug: sinon.stub(),
};

describe('ServerResponseBuilder Tests', function() {
  let serverResponseBuilder = new ServerResponseBuilder(mockLogger);

  describe('#buildResponse', function() {
    let mockRequest = {};
    let mockResponse = {
      server: {
        id: '123',
        name: 'name',
        _rev: 'rev',
      },
      serverToken: {
        token: 'token',
        tokenExpiration: 123456789,
      },
      json: sinon.stub(),
    };

    beforeEach(function() {
      mockLogger.debug.resetHistory();
      serverResponseBuilder.buildResponse(mockRequest, mockResponse);
    });

    it('passes response', function() {
      expect(mockResponse.json.calledWith(sinon.match({ metadata: { version: '1.0.0' },
        server: { server: { id: '123', name: 'name', _rev: 'rev' }, token: { expiresAt: 123456789, token: 'token' } } })));
    });

    it('logs response', function() {
      expect(mockLogger.debug.calledOnce);
      expect(mockLogger.debug.getCall(0).args[0]).to.be('Response: %j');
      expect(mockLogger.debug.getCall(0).args[1]).to.be.eql({ metadata: { version: '1.0.0' },
        server: { server: { id: '123', name: 'name', _rev: 'rev' }, token: { expiresAt: 123456789, token: 'token' } } });
    });
  });
});
