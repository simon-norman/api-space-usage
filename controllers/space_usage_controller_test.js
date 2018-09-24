
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const SpaceUsageControllerFactory = require('./space_usage_controller');
const { getConfigForEnvironment } = require('../config/config.js');
const SpaceUsage = require('../models/space_usage');
const { mockRes, mockReq } = require('sinon-express-mock');
const mongoose = require('mongoose');

chai.use(sinonChai);
const { expect } = chai;

const sinonSandbox = sinon.sandbox.create();


describe('space_usage_controller', () => {
  let savedMockSpaceUsage;
  let spaceUsageController;
  let mockRequest;
  let mockResponse;

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsages = await SpaceUsage.find({});

    if (spaceUsages.length) {
      await SpaceUsage.collection.drop();
    }
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });
  });

  beforeEach(async () => {
    await ensureSpaceUsageCollectionEmpty();

    spaceUsageController = SpaceUsageControllerFactory(SpaceUsage);

    const requestData = {
      body: {
        numberOfPeopleRecorded: 1,
        spaceId: 0,
        usagePeriodStartTime: new Date('Monday, 24-Sep-18 12:45:00 UTC'),
        usagePeriodEndTime: new Date('Monday, 24-Sep-18 13:00:00 UTC'),
      },
    };
    mockRequest = mockReq(requestData);

    mockResponse = mockRes();
  });

  after(async () => {
    await ensureSpaceUsageCollectionEmpty();
    await mongoose.connection.close();
  });

  describe('Save space usage', () => {
    it('should save new space usage and return saved result', async function () {
      await spaceUsageController.saveSpaceUsage(mockRequest, mockResponse);

      savedMockSpaceUsage = await SpaceUsage.find({});

      expect(mockResponse.status).always.have.been.calledOnceWithExactly(200);

      expect(mockResponse.json.firstCall.args[0].numberOfPeopleRecorded)
        .deep.equals(savedMockSpaceUsage[0].numberOfPeopleRecorded);

      expect(mockResponse.json.firstCall.args[0].spaceId)
        .deep.equals(savedMockSpaceUsage[0].spaceId);

      expect(mockResponse.json.firstCall.args[0].usagePeriodStartTime)
        .deep.equals(savedMockSpaceUsage[0].usagePeriodStartTime);

      expect(mockResponse.json.firstCall.args[0].usagePeriodEndTime)
        .deep.equals(savedMockSpaceUsage[0].usagePeriodEndTime);

      expect(mockResponse.json.firstCall.args[0]._id)
        .deep.equals(savedMockSpaceUsage[0]._id);
    });
  });

  describe('Save space usage error handling', () => {
    afterEach(() => {
      sinonSandbox.restore();
    });

    it('should pass error via Next to error handler if error thrown during save', async function () {
      const errorDuringSave = new Error('errormessage');
      const stubbedFindOneAndUpdate = sinonSandbox.stub(SpaceUsage, 'findOneAndUpdate');
      stubbedFindOneAndUpdate.returns(Promise.reject(errorDuringSave));

      const nextSpy = sinonSandbox.spy();

      await spaceUsageController.saveSpaceUsage(mockRequest, mockResponse, nextSpy);

      expect(nextSpy.firstCall.args[0]).to.be.an.instanceof(Error);
      expect(nextSpy.firstCall.args[0].message).equals('errormessage');
    });
  });
});

