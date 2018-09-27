
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const sinon = require('sinon');
const mongoose = require('mongoose');
const SaveSpaceUsageControllerFactory = require('../controllers/save_space_usage_controller');
const { GraphQLServer } = require('graphql-yoga');
const SpaceUsage = require('../models/space_usage');

const { expect } = chai;

const sinonSandbox = sinon.sandbox.create();


describe('Save space usage', () => {
  let spaceUsageApiInstance;
  let mockSpaceUsage;
  let createSpaceUsageMutationString;
  let typeDefs;
  let resolvers;

  const setUpSpaceUsageApi = async () => {
    const spaceUsageApi = new GraphQLServer({
      typeDefs,
      resolvers,
    });
    spaceUsageApiInstance = await spaceUsageApi.start({
      debug: false,
    });
  };

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsageRecords = await SpaceUsage.find({});
    if (spaceUsageRecords.length) {
      await SpaceUsage.collection.drop();
    }
  };

  const setUpMockSpaceUsage = () => {
    mockSpaceUsage = {
      spaceId: '1',
      usagePeriodEndTime: new Date('October 10, 2010 11:15:00').getTime(),
      usagePeriodStartTime: new Date('October 10, 2010 11:00:00').getTime(),
      numberOfPeopleRecorded: 3,
    };
  };

  const setUpCreateSpaceUsageInputString = () => {
    const mockSpaceUsageAsJsonString = JSON.stringify(mockSpaceUsage);
    const mockSpaceUsageAsGraphQlInputString = mockSpaceUsageAsJsonString.replace(/"([^(")"]+)":/g, '$1:');

    createSpaceUsageMutationString = `mutation {CreateSpaceUsage(input: ${mockSpaceUsageAsGraphQlInputString}) {
      _id
      spaceId
      usagePeriodStartTime
      usagePeriodEndTime
      numberOfPeopleRecorded
    }}`;
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    ({ typeDefs, resolvers } = SaveSpaceUsageControllerFactory(SpaceUsage));

    await setUpSpaceUsageApi();

    request = request('http://localhost:4000');
  });

  beforeEach(async () => {
    await ensureSpaceUsageCollectionEmpty();

    setUpMockSpaceUsage();

    setUpCreateSpaceUsageInputString();
  });

  afterEach(() => {
    sinonSandbox.restore();
  });

  after(async () => {
    await spaceUsageApiInstance.close();
    await mongoose.connection.close();
  });

  it('should save new space usage and return saved result', async function () {
    const response = await request
      .post('/')
      .send({
        query: createSpaceUsageMutationString,
      });

    const allSavedSpaceUsages = await SpaceUsage.find({});
    const savedMockSpaceUsage = allSavedSpaceUsages[0];

    expect(response.body.data.CreateSpaceUsage._id).equals(savedMockSpaceUsage.id);
    expect(response.body.data.CreateSpaceUsage.spaceId).equals(savedMockSpaceUsage.spaceId);

    expect(response.body.data.CreateSpaceUsage.numberOfPeopleRecorded)
      .equals(savedMockSpaceUsage.numberOfPeopleRecorded);

    expect(response.body.data.CreateSpaceUsage.usagePeriodStartTime)
      .equals(savedMockSpaceUsage.usagePeriodStartTime);

    expect(response.body.data.CreateSpaceUsage.usagePeriodEndTime)
      .equals(savedMockSpaceUsage.usagePeriodEndTime);
  });

  it('should return error if error thrown during save', async function () {
    const stubbedFindByIdAndUpdate = sinonSandbox.stub(SpaceUsage, 'findByIdAndUpdate');
    const errorMessage = 'error message';
    stubbedFindByIdAndUpdate.throws(new Error(errorMessage));

    const response = await request
      .post('/')
      .send({
        query: createSpaceUsageMutationString,
      });

    expect(response.body.errors[0].message).equals(errorMessage);
  });

  it('should return error if no space ID passed in input', async function () {
    delete mockSpaceUsage.spaceId;
    setUpCreateSpaceUsageInputString();

    const response = await request
      .post('/')
      .send({
        query: createSpaceUsageMutationString,
      });

    expect(response.body.errors.length).greaterThan(0);
  });
});

