
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
  let mockSpaceUsages;
  let typeDefs;
  let resolvers;

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

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsageRecords = await SpaceUsage.find({});
    if (spaceUsageRecords.length) {
      await SpaceUsage.collection.drop();
    }
  };

  const ensureClientCollectionEmpty = async () => {
    const clients = await Client.find({});
    if (clients.length) {
      await Client.collection.drop();
    }
  };

  const setPromisifiedTimeout = timeoutPeriodInMilliseconds => new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeoutPeriodInMilliseconds);
  });

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    ({ typeDefs, resolvers } = GetSpaceUsageControllerFactory());
  });

  beforeEach(async () => {
    setUpMockSpaceUsages();

    await ensureSpaceUsageCollectionEmpty();

    await ensureClientCollectionEmpty();
  });

  it('should retrieve all space usages for a given site id', async function (done) {
    const client = new Client({
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
              spaceIds: ['0', '1'],
            },
          ],
        },
      ],
    });
    const savedClient = await client.save();
    const secondSiteId = savedClient.sites[1].id;

    await SpaceUsage.insertMany(mockSpaceUsages);
    const savedSpaceUsages = await SpaceUsage.find({});

    const spaceUsageApi = new GraphQLServer({
      typeDefs,
      resolvers,
    });
    await spaceUsageApi.start();

    request = request('http://localhost:4000');

    const response = await request
      .post('/')
      .send({
        query: `{ spaceUsagesBySiteId(siteId: "3") {
        spaceId
        usagePeriodStartTime
        usagePeriodEndTime
        numberOfPeopleRecorded
      }}`,
      });

    // check that returns all space usages loaded earlier
    expect(response.data).equals(savedSpaceUsages);
  });
});

