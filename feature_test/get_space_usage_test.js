
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const mongoose = require('mongoose');
const Client = require('../models/client');
const GetSpaceUsageControllerFactory = require('../controllers/get_space_usage_controller');
const { GraphQLServer } = require('graphql-yoga');
const SpaceUsage = require('../models/space_usage');

const { expect } = chai;


describe('Get space usage', () => {
  let spaceUsageApiInstance;
  let mockSiteId;
  let mockSpaceUsages;
  let spaceUsagesExpectedToBeInResponse;
  let typeDefs;
  let resolvers;

  const setUpSpaceUsageApi = async () => {
    const spaceUsageApi = new GraphQLServer({
      typeDefs,
      resolvers,
    });
    spaceUsageApiInstance = await spaceUsageApi.start();
  };

  const ensureClientCollectionEmpty = async () => {
    const clients = await Client.find({});
    if (clients.length) {
      await Client.collection.drop();
    }
  };

  const setUpMockSites = async () => {
    await ensureClientCollectionEmpty();

    const mockClient = new Client({
      name: 'ABC Inc',
      sites: [
        {
          name: 'ABC site a',
          floors: [
            { name: 'Ground floor', spaceIds: ['5', '6'] },
          ],
        },
        {
          name: 'ABC site b',
          floors: [
            { name: 'Ground floor', spaceIds: ['1'] },
            { name: 'First floor', spaceIds: ['2'] },
          ],
        },
      ],
    });
    const savedMockClient = await mockClient.save();

    mockSiteId = savedMockClient.sites[1]._id;
  };

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsageRecords = await SpaceUsage.find({});
    if (spaceUsageRecords.length) {
      await SpaceUsage.collection.drop();
    }
  };

  const setUpMockSpaceUsages = async () => {
    mockSpaceUsages = [];
    let spaceId = 0;
    for (let i = 1; i <= 4; i += 1) {
      mockSpaceUsages.push({
        spaceId,
        usagePeriodStartTime: new Date('October 10, 2010 11:00:00'),
        usagePeriodEndTime: new Date('October 10, 2010 11:15:00'),
        numberOfPeopleRecorded: 5,
      });
      spaceId += 1;
    }

    await SpaceUsage.insertMany(mockSpaceUsages);
  };

  const convertMongoDocsToHttpResponseFormat = (mongoDocs) => {
    const convertedMongoDocs = JSON.parse(JSON.stringify(mongoDocs));
    for (const convertedMongoDoc of convertedMongoDocs) {
      delete convertedMongoDoc.__v;
    }

    return convertedMongoDocs;
  };

  const setUpSpaceUsagesExpectedToBeInResponse = async () => {
    await ensureSpaceUsageCollectionEmpty();

    await setUpMockSpaceUsages();

    const savedSpaceUsages = await SpaceUsage.find({ spaceId: { $in: ['1', '2'] } });
    spaceUsagesExpectedToBeInResponse
      = convertMongoDocsToHttpResponseFormat(savedSpaceUsages);
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    ({ typeDefs, resolvers } = GetSpaceUsageControllerFactory(Client, SpaceUsage));
  });

  beforeEach(async () => {
    await setUpSpaceUsageApi();

    await setUpMockSites();

    await setUpSpaceUsagesExpectedToBeInResponse();

    request = request('http://localhost:4000');
  });

  after(async () => {
    await spaceUsageApiInstance.close();
    await mongoose.connection.close();
  });

  it('should retrieve all space usages for a given site id', async function () {
    const response = await request
      .post('/')
      .send({
        query: `{ spaceUsagesBySiteId(siteId: "${mockSiteId}") {
        _id
        spaceId
        usagePeriodStartTime
        usagePeriodEndTime
        numberOfPeopleRecorded
      }}`,
      });

    expect(response.body.data.spaceUsagesBySiteId)
      .deep.equals(spaceUsagesExpectedToBeInResponse);
  });
});

