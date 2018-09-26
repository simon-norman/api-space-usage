
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
const request = require('supertest');
const mongoose = require('mongoose');
const Client = require('../models/client');
const { typeDefs, resolvers } = require('../controllers/get_space_usage_controller');
const { GraphQLServer } = require('graphql-yoga');
const SpaceUsage = require('../models/space_usage');

const { expect } = chai;


describe('Get space usage', () => {
  let mockSpaceUsages;

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

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });
  });

  beforeEach(() => {
    setUpMockSpaceUsages();
  });

  it('should retrieve all space usages for a given site id', async function () {
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
    const secondSiteId = await client.save().sites[1]._id;

    await SpaceUsage.insertMany(mockSpaceUsages);
    const savedSpaceUsages = await SpaceUsage.find({});

    const spaceUsageApi = new GraphQLServer({
      typeDefs,
      resolvers,
    });
    await spaceUsageApi.start();

    const response = await request(spaceUsageApi)
      .get('/')
      .send({ query: `{ spaceUsagesBySiteId(siteId: ${secondSiteId}) }` });

    // check that returns all space usages loaded earlier
    expect(response.data).equals(savedSpaceUsages);
  });
});

