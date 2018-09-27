
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Client = require('../models/client');
const GetSpaceUsageControllerFactory = require('../controllers/get_space_usage_controller');
const { GraphQLServer } = require('graphql-yoga');
const SpaceUsage = require('../models/space_usage');

const { expect } = chai;
const sinonSandbox = sinon.sandbox.create();


describe('Get space usage', () => {
  let spaceUsageApiInstance;
  let mockSiteId;
  let mockSpaceUsages;
  let spaceUsagesExpectedToBeInResponse;
  let getSpaceUsageQueryString;
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
        usagePeriodStartTime: new Date('October 10, 2010 11:00:00').getTime(),
        usagePeriodEndTime: new Date('October 10, 2010 11:15:00').getTime(),
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

  const setUpGetSpaceUsageQueryString = () => {
    getSpaceUsageQueryString = `{ SpaceUsagesBySiteId(siteId: "${mockSiteId}") {
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

    ({ typeDefs, resolvers } = GetSpaceUsageControllerFactory(Client, SpaceUsage));

    await setUpSpaceUsageApi();

    request = request('http://localhost:4000');
  });

  beforeEach(async () => {
    await setUpMockSites();

    await setUpSpaceUsagesExpectedToBeInResponse();

    setUpGetSpaceUsageQueryString();
  });

  afterEach(() => {
    sinonSandbox.restore();
  });

  after(async () => {
    await spaceUsageApiInstance.close();
    await mongoose.connection.close();
  });

  it('should retrieve all space usages for a given site id', async function () {
    const response = await request
      .post('/')
      .send({
        query: getSpaceUsageQueryString,
      });

    expect(response.body.data.SpaceUsagesBySiteId)
      .deep.equals(spaceUsagesExpectedToBeInResponse);
  });

  it('should return error if error thrown during get', async function () {
    const stubbedAggregate = sinonSandbox.stub(Client, 'aggregate');
    const errorMessage = 'error message';
    stubbedAggregate.throws(new Error(errorMessage));

    const response = await request
      .post('/')
      .send({
        query: getSpaceUsageQueryString,
      });

    expect(response.body.errors[0].message).equals(errorMessage);
  });
});

