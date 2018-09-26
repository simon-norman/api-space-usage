
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
  let mockClients;
  let mockSpaceUsages;
  let savedSpaceUsagesInHttpResponseFormat;
  let typeDefs;
  let resolvers;

  const setUpSpaceUsageApi = async () => {
    const spaceUsageApi = new GraphQLServer({
      typeDefs,
      resolvers,
    });
    await spaceUsageApi.start();
  };

  const ensureClientCollectionEmpty = async () => {
    const clients = await Client.find({});
    if (clients.length) {
      await Client.collection.drop();
    }
  };

  const setUpMockClients = async () => {
    await ensureClientCollectionEmpty();
    
    mockClients = [];
    let spaceId1 = 0;
    for (let i = 1; i <= 2; i += 1) {
      mockClients.push({
        name: 'ABC Inc',
        sites: [
          {
            name: 'ABC site a',
          },
          {
            name: 'ABC site b',
            floors: [
              {
                name: 'Ground floor',
                spaceIds: [spaceId1.toString(), '1'],
              },
            ],
          },
        ],
      });

      spaceId1 += 10;
    }
  };

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsageRecords = await SpaceUsage.find({});
    if (spaceUsageRecords.length) {
      await SpaceUsage.collection.drop();
    }
  };

  const setUpMockSpaceUsages = () => {
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
  };

  const convertMongoDocsToHttpResponseFormat = (mongoDocs) => {
    const convertedMongoDocs = JSON.parse(JSON.stringify(mongoDocs));
    for (const convertedMongoDoc of convertedMongoDocs) {
      delete convertedMongoDoc.__v;
    }

    return convertedMongoDocs;
  };

  const setUpSavedSpaceUsagesInHttpResponseFormat = async () => {
    await ensureSpaceUsageCollectionEmpty();

    setUpMockSpaceUsages();

    await SpaceUsage.insertMany(mockSpaceUsages);
    const savedSpaceUsages = await SpaceUsage.find({ spaceId: { $in: ['0', '1'] } });
    savedSpaceUsagesInHttpResponseFormat
      = convertMongoDocsToHttpResponseFormat(savedSpaceUsages);
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    ({ typeDefs, resolvers } = GetSpaceUsageControllerFactory(Client, SpaceUsage));
  });

  beforeEach(async () => {
    setUpSpaceUsageApi();

    setUpMockClients();

    setUpSavedSpaceUsagesInHttpResponseFormat();
  });

  it('should retrieve all space usages for a given site id', async function () {
    await Client.insertMany(mockClients);
    const savedClients = await Client.find({});
    const secondSiteId = savedClients[0].sites[1].id;


    request = request('http://localhost:4000');

    const response = await request
      .post('/')
      .send({
        query: `{ spaceUsagesBySiteId(siteId: "${secondSiteId}") {
        _id
        spaceId
        usagePeriodStartTime
        usagePeriodEndTime
        numberOfPeopleRecorded
      }}`,
      });

    // check that returns all space usages loaded earlier
    expect(response.body.data.spaceUsagesBySiteId).deep.equals(savedSpaceUsagesInHttpResponseFormat);
  });
});

