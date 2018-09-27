
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const mongoose = require('mongoose');
const SaveSpaceUsageControllerFactory = require('../controllers/save_space_usage_controller');
const { GraphQLServer } = require('graphql-yoga');
const SpaceUsage = require('../models/space_usage');

const { expect } = chai;


describe('Save space usage', () => {
  let spaceUsageApiInstance;
  let typeDefs;
  let resolvers;

  const setUpSpaceUsageApi = async () => {
    const spaceUsageApi = new GraphQLServer({
      typeDefs,
      resolvers,
    });
    spaceUsageApiInstance = await spaceUsageApi.start();
  };

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsageRecords = await SpaceUsage.find({});
    if (spaceUsageRecords.length) {
      await SpaceUsage.collection.drop();
    }
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    ({ typeDefs, resolvers } = SaveSpaceUsageControllerFactory(SpaceUsage));
  });

  beforeEach(async () => {
    await setUpSpaceUsageApi();

    await ensureSpaceUsageCollectionEmpty();

    request = request('http://localhost:4000');
  });

  after(async () => {
    await spaceUsageApiInstance.close();
    await mongoose.connection.close();
  });

  it('should save new space usage and return saved result', async function () {
    const usagePeriodStartTime = new Date('October 10, 2010 11:00:00').getTime();
    const usagePeriodEndTime = new Date('October 10, 2010 11:15:00').getTime();

    const response = await request
      .post('/')
      .send({
        query: `mutation {CreateSpaceUsage(input: {spaceId: "1", 
        usagePeriodEndTime: ${usagePeriodEndTime}, 
        usagePeriodStartTime:${usagePeriodStartTime}, 
        numberOfPeopleRecorded:3}) {
        _id
        spaceId
        usagePeriodStartTime
        usagePeriodEndTime
        numberOfPeopleRecorded
      }}`,
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
});

