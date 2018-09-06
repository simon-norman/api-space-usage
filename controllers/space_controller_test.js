
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const SpaceControllerFactory = require('./space_controller');
const { mockRes } = require('sinon-express-mock');

chai.use(sinonChai);
const { expect } = chai;


describe('space_controller', () => {
  describe('Get spaces', () => {
    let mockSpaces;
    let mockSpaceModel;
    let spaceController;
    let mockRequest;
    let mockResponse;
    let nextSpy;

    const setUpMockSpaceModel = () => {
      mockSpaces = ['space 1', 'space 2'];
      mockSpaceModel = {
        find: () => Promise.resolve(mockSpaces),
      };
    };

    beforeEach(() => {
      setUpMockSpaceModel();

      spaceController = SpaceControllerFactory(mockSpaceModel);

      mockRequest = {};

      mockResponse = mockRes();

      nextSpy = sinon.spy();
    });

    it('should retrieve all spaces', async function () {
      await spaceController.getSpaces(mockRequest, mockResponse);

      expect(mockResponse.status).always.have.been.calledOnceWithExactly(200);
      expect(mockResponse.json).always.have.been.calledOnceWithExactly(mockSpaces);
    });

    it('should pass 404 error via Next to error handler if no spaces found', async function () {
      mockSpaceModel.find = () => Promise.resolve([]);
      await spaceController.getSpaces(mockRequest, mockResponse, nextSpy);

      expect(nextSpy.firstCall.args[0].status).to.equal(404);
      expect(nextSpy.firstCall.args[0].message).to.equal('Spaces not found');
    });

    it('should pass error via Next to error handler if error thrown during find', async function () {
      const errorDuringFind = new Error();
      mockSpaceModel.find = () => Promise.reject(errorDuringFind);

      await spaceController.getSpaces(mockRequest, mockResponse, nextSpy);

      expect(nextSpy.firstCall.args[0]).to.be.an.instanceof(Error);
    });
  });
});

