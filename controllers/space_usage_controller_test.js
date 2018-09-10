
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const SpaceUsageControllerFactory = require('./space_usage_controller');
const { mockRes, mockReq } = require('sinon-express-mock');

chai.use(sinonChai);
const { expect } = chai;


describe('space_usage_controller', () => {
  describe('Save space usage', () => {
    let mockSavedSpaceUsage;
    let stubbedFindOneAndUpdate;
    let mockSpaceUsageModel;
    let spaceUsageController;
    let mockRequest;
    let mockResponse;
    let nextSpy;

    const setUpStubbedFindOneAndUpdate = () => {
      mockSavedSpaceUsage = 'saved space usage';

      stubbedFindOneAndUpdate = sinon.stub();
      stubbedFindOneAndUpdate.returns(Promise.resolve(mockSavedSpaceUsage));
    };

    const setUpMockSpaceUsageModel = () => {
      setUpStubbedFindOneAndUpdate();

      mockSpaceUsageModel = {
        findOneAndUpdate: stubbedFindOneAndUpdate,
      };
    };

    beforeEach(() => {
      setUpMockSpaceUsageModel();

      spaceUsageController = SpaceUsageControllerFactory(mockSpaceUsageModel);

      const requestData = {
        body: {
          numberOfPeopleRecorded: 1,
        },
      };
      mockRequest = mockReq(requestData);

      mockResponse = mockRes();

      nextSpy = sinon.spy();
    });

    it('should save new space usage and return saved result', async function () {
      await spaceUsageController.saveSpaceUsage(mockRequest, mockResponse);

      expect(stubbedFindOneAndUpdate).always.have.been.calledOnceWithExactly(
        { _id: mockRequest.body._id },
        mockRequest.body,
        {
          upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true,
        },
      );
      expect(mockResponse.status).always.have.been.calledOnceWithExactly(200);
      expect(mockResponse.json).always.have.been.calledOnceWithExactly(mockSavedSpaceUsage);
    });

    it('should pass error via Next to error handler if error thrown during save', async function () {
      const errorDuringSave = new Error('errormessage');
      stubbedFindOneAndUpdate.returns(Promise.reject(errorDuringSave));

      await spaceUsageController.saveSpaceUsage(mockRequest, mockResponse, nextSpy);

      expect(nextSpy.firstCall.args[0]).to.be.an.instanceof(Error);
      expect(nextSpy.firstCall.args[0].message).equals('errormessage');
    });
  });
});

