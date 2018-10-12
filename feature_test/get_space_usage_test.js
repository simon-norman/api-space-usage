
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Client = require('../models/client_model');
const GetSpaceUsageControllerFactory = require('../controllers/get_space_usage_controller');
const SpaceUsage = require('../models/space_usage_model');
const Space = require('../models/space_model');
const setUpSpaceUsageApiTestInstance = require('./space_usage_api_test_instance_factory');
const ensureCollectionEmpty = require('./helpers/mongo_collection_drop');

const { expect } = chai;
const sinonSandbox = sinon.sandbox.create();


describe('Get space usage', () => {
  let spaceUsageApiInstance;
  let mockSiteId;
  let spaceUsagesExpectedToBeInResponse;
  let getSpaceUsageQueryString;

  const setUpMockSpacesInDb = async ({ numberOfSpaces }) => {
    await ensureCollectionEmpty(Space);

    const mockSpaces = [];
    let spaceId = 0;

    for (let i = 1; i <= numberOfSpaces; i += 1) {
      mockSpaces.push({
        _id: spaceId.toString(),
        name: `Space${spaceId}`,
        category: 'Meeting room',
        occupancyCapacity: 5,
      });
      spaceId += 1;
    }

    await Space.insertMany(mockSpaces);
    return mockSpaces;
  };

  const setUpMockSitesInDb = async (site1MockSpaceIds, site2MockSpaceIds) => {
    await ensureCollectionEmpty(Client);

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

  const setUpMockSpaceUsagesInDb = async (mockSpaces) => {
    await ensureCollectionEmpty(SpaceUsage);

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
    { $addFields: { spaceName: '$name', spaceCategory: '$category' } },
    {
      $project: {
        spaceInfo: 0, name: 0, category: 0, __v: 0, occupancyCapacity: 0,
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
      spaceCategory
      usagePeriodStartTime
      usagePeriodEndTime
      occupancy
      numberOfPeopleRecorded
    }}`;
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    ({ request, spaceUsageApiInstance } = await setUpSpaceUsageApiTestInstance({
      controllerFactory: GetSpaceUsageControllerFactory,
      controllerFactoryDependencies: [Client, SpaceUsage],
    }));
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

