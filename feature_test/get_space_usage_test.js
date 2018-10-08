
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Client = require('../models/client_model');
const GetSpaceUsageControllerFactory = require('../controllers/get_space_usage_controller');
const { GraphQLServer } = require('graphql-yoga');
const SpaceUsage = require('../models/space_usage_model');
const Space = require('../models/space_model');
const { readFileSync } = require('fs');

const { expect } = chai;
const sinonSandbox = sinon.sandbox.create();


describe('Get space usage', () => {
  let spaceUsageApiInstance;
  let mockSiteId;
  let spaceUsagesExpectedToBeInResponse;
  let getSpaceUsageQueryString;

  const setUpSpaceUsageApi = async () => {
    const { typeDefs, resolvers } = GetSpaceUsageControllerFactory(Client, SpaceUsage);
    const spaceUsageDataSchema = readFileSync('graphql_schema/space_usage_schema.graphql', 'utf8');

    const spaceUsageApi = new GraphQLServer({
      typeDefs: [spaceUsageDataSchema, typeDefs],
      resolvers,
    });

    spaceUsageApiInstance = await spaceUsageApi.start({
      debug: false,
    });

    request = request('http://localhost:4000');
  };

  const ensureSpaceCollectionEmpty = async () => {
    const spaceRecords = await Space.find({});
    if (spaceRecords.length) {
      await Space.collection.drop();
    }
  };

  const setUpMockSpacesInDb = async ({ numberOfSpaces }) => {
    await ensureSpaceCollectionEmpty();

    const mockSpaces = [];
    let spaceId = 0;

    for (let i = 1; i <= numberOfSpaces; i += 1) {
      mockSpaces.push({
        _id: spaceId.toString(),
        name: `Space${spaceId}`,
        occupancyCapacity: 5,
      });
      spaceId += 1;
    }

    await Space.insertMany(mockSpaces);
    return mockSpaces;
  };

  const ensureClientCollectionEmpty = async () => {
    const clients = await Client.find({});
    if (clients.length) {
      await Client.collection.drop();
    }
  };

  const setUpMockSitesInDb = async (site1MockSpaceIds, site2MockSpaceIds) => {
    await ensureClientCollectionEmpty();

    mockSiteId = '1029';
    const mockClient = new Client({
      name: 'ABC Inc',
      sites: [
        {
          _id: '2004',
          name: 'ABC site a',
          floors: [
            { name: 'Ground floor', spaceIds: site1MockSpaceIds },
          ],
        },
        {
          _id: mockSiteId,
          name: 'ABC site b',
          floors: [
            { name: 'Ground floor', spaceIds: site2MockSpaceIds[0] },
            { name: 'First floor', spaceIds: site2MockSpaceIds[1] },
          ],
        },
      ],
    });
    await mockClient.save();
  };

  const ensureSpaceUsageCollectionEmpty = async () => {
    const spaceUsageRecords = await SpaceUsage.find({});
    if (spaceUsageRecords.length) {
      await SpaceUsage.collection.drop();
    }
  };

  const setUpMockSpaceUsagesInDb = async (mockSpaces) => {
    await ensureSpaceUsageCollectionEmpty();

    const mockSpaceUsages = [];

    for (const mockSpace of mockSpaces) {
      mockSpaceUsages.push({
        spaceId: mockSpace._id,
        usagePeriodStartTime: new Date('October 10, 2010 11:00:00').getTime(),
        usagePeriodEndTime: new Date('October 10, 2010 11:15:00').getTime(),
        numberOfPeopleRecorded: 5,
        occupancy: 0.9,
      });
    }

    const mockSavedSpaceUsages = await SpaceUsage.insertMany(mockSpaceUsages);
    return mockSavedSpaceUsages;
  };

  const getSpaceUsagesJoinedWithSpaces = ({ spaceIds }) => SpaceUsage.aggregate([
    { $match: { spaceId: { $in: spaceIds } } },
    {
      $lookup: {
        from: 'spaces',
        localField: 'spaceId',
        foreignField: '_id',
        as: 'spaceInfo',
      },
    },
    {
      $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$spaceInfo', 0] }, '$$ROOT'] } },
    },
    { $addFields: { spaceName: '$name' } },
    {
      $project: {
        spaceInfo: 0, numberOfPeopleRecorded: 0, name: 0, __v: 0, occupancyCapacity: 0,
      },
    }]);

  const convertMongoDocsToGraphQlResponse = (mongoDocs) => {
    const convertedMongoDocs = JSON.parse(JSON.stringify(mongoDocs));
    for (const convertedMongoDoc of convertedMongoDocs) {
      delete convertedMongoDoc.__v;
      delete convertedMongoDoc._id;
    }

    return convertedMongoDocs;
  };

  const setUpSpaceUsagesExpectedToBeInResponse = async (spaceIds) => {
    const savedSpaceUsagesJoinedWithSpaces
      = await getSpaceUsagesJoinedWithSpaces({ spaceIds });

    spaceUsagesExpectedToBeInResponse
      = convertMongoDocsToGraphQlResponse(savedSpaceUsagesJoinedWithSpaces);
  };

  const setUpGetSpaceUsageQueryString = () => {
    getSpaceUsageQueryString = `{ SpaceUsagesBySiteId(siteId: "${mockSiteId}") {
      spaceId
      spaceName
      usagePeriodStartTime
      usagePeriodEndTime
      occupancy
    }}`;
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    await setUpSpaceUsageApi();
  });

  beforeEach(async () => {
    const mockSpaces = await setUpMockSpacesInDb({ numberOfSpaces: 4 });
    const site1MockSpaceIds = [mockSpaces[0]._id, mockSpaces[1]._id];
    const site2MockSpaceIds = [mockSpaces[2]._id, mockSpaces[3]._id];

    await setUpMockSitesInDb(site1MockSpaceIds, site2MockSpaceIds);

    await setUpMockSpaceUsagesInDb(mockSpaces);

    await setUpSpaceUsagesExpectedToBeInResponse(site2MockSpaceIds);

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

