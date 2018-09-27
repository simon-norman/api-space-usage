
const chai = require('chai');
const { getConfigForEnvironment } = require('../config/config.js');
let request = require('supertest');
const sinon = require('sinon');
const mongoose = require('mongoose');
const SpaceControllerFactory = require('../controllers/space_controller.js');
const { GraphQLServer } = require('graphql-yoga');
const Space = require('../models/space_model');
const { readFileSync } = require('fs');

const { expect } = chai;
const sinonSandbox = sinon.sandbox.create();


describe('Get spaces', () => {
  let spaceApiInstance;
  let mockSpaces;
  let spacesExpectedToBeInResponse;
  let getSpacesQueryString;
  let typeDefs;
  let resolvers;

  const setUpSpaceApi = async () => {
    ({ typeDefs, resolvers } = SpaceControllerFactory(Space));
    const spaceDataSchema = readFileSync('graphql_schema/space_usage_schema.graphql', 'utf8');

    const spaceApi = new GraphQLServer({
      typeDefs: [spaceDataSchema, typeDefs],
      resolvers,
    });

    spaceApiInstance = await spaceApi.start({
      debug: false,
    });

    request = request('http://localhost:4000');
  };

  const ensureSpacesCollectionEmpty = async () => {
    const spaces = await Space.find({});
    if (spaces.length) {
      await Space.collection.drop();
    }
  };

  const setUpMockSpaces = async () => {
    mockSpaces = [];
    for (let spaceId = 1; spaceId <= 2; spaceId += 1) {
      mockSpaces.push({
        _id: spaceId.toString(),
        name: 'meeting room',
        occupancyCapacity: 3,
      });
    }

    await Space.insertMany(mockSpaces);
  };

  const convertMongoDocsToHttpResponseFormat = (mongoDocs) => {
    const convertedMongoDocs = JSON.parse(JSON.stringify(mongoDocs));
    for (const convertedMongoDoc of convertedMongoDocs) {
      delete convertedMongoDoc.__v;
    }

    return convertedMongoDocs;
  };

  const setUpSpacesExpectedToBeInResponse = async () => {
    await ensureSpacesCollectionEmpty();

    await setUpMockSpaces();

    const savedSpaces = await Space.find({});
    spacesExpectedToBeInResponse
      = convertMongoDocsToHttpResponseFormat(savedSpaces);
  };

  const setUpGetSpaceQueryString = () => {
    getSpacesQueryString = `{ GetAllSpaces {
      _id
      name
      occupancyCapacity
    }}`;
  };

  before(async () => {
    const config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

    await setUpSpaceApi();

    await setUpSpacesExpectedToBeInResponse();

    setUpGetSpaceQueryString();
  });

  afterEach(() => {
    sinonSandbox.restore();
  });

  after(async () => {
    await spaceApiInstance.close();
    await mongoose.connection.close();
  });

  it('should retrieve all spaces', async function () {
    const response = await request
      .post('/')
      .send({
        query: getSpacesQueryString,
      });

    expect(response.body.data.GetAllSpaces)
      .deep.equals(spacesExpectedToBeInResponse);
  });

  it('should throw error if no spaces found', async function () {
    await ensureSpacesCollectionEmpty();

    const response = await request
      .post('/')
      .send({
        query: getSpacesQueryString,
      });

    expect(response.body.errors[0].message)
      .equals('No spaces found');
  });

  it('should return error if error thrown during get', async function () {
    const stubbedFind = sinonSandbox.stub(Space, 'find');
    const errorMessage = 'error message';
    stubbedFind.throws(new Error(errorMessage));

    const response = await request
      .post('/')
      .send({
        query: getSpacesQueryString,
      });

    expect(response.body.errors[0].message).equals(errorMessage);
  });
});

