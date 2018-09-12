
const { expect } = require('chai');
const Raven = require('raven');
const sinon = require('sinon');
const LoggerFactory = require('./logger.js');

describe('logger', () => {
  let mockError;
  let consoleLogSpy;
  let stubbedRavenCaptureException;

  before(() => {
    const mockErrorMessage = 'mock error message';
    mockError = new Error(mockErrorMessage);
    consoleLogSpy = sinon.spy(console, 'log');
    stubbedRavenCaptureException = sinon.stub(Raven, 'captureException');
  });

  beforeEach(() => {
    consoleLogSpy.resetHistory();
    stubbedRavenCaptureException.resetHistory();
  });

  describe('logging and error handling in production', () => {
    it('should log exceptions with Raven when in production', async function () {
      const { logException } = LoggerFactory('production');
      mockError = new Error('error');
      logException(mockError);

      expect(stubbedRavenCaptureException.calledOnceWithExactly(mockError)).to.equal(true);
    });
  });

  describe('logging and error handling in development', () => {
    it('should log any unhandled exceptions to the console when NOT in production', function () {
      const { wrapperToHandleUnhandledExceptions } = LoggerFactory('development');
      wrapperToHandleUnhandledExceptions(() => {
        throw mockError;
      });

      expect(consoleLogSpy.calledOnceWithExactly(mockError)).to.equal(true);
    });

    it('should log exception stack to the console when NOT in production', function () {
      const { logException } = LoggerFactory('development');
      logException(mockError);

      expect(consoleLogSpy.calledOnceWithExactly(mockError.stack)).to.equal(true);
    });
  });
});

