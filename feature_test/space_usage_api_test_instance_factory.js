const { readFileSync } = require('fs');
const { GraphQLServer } = require('graphql-yoga');
const { getConfigForEnvironment } = require('../config/config.js');
const mongoose = require('mongoose');
const request = require('supertest');

const connectToSpaceUsageDb = async () => {
  const config = getConfigForEnvironment(process.env.NODE_ENV);
  await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });
};

const setUpSpaceUsageApi = ({ controllerFactory, controllerFactoryDependencies }) => {
  const { typeDefs, resolvers } = controllerFactory(...controllerFactoryDependencies);
  const spaceUsageDataSchema = readFileSync('graphql_schema/space_usage_schema.graphql', 'utf8');

  return new GraphQLServer({
    typeDefs: [spaceUsageDataSchema, typeDefs],
    resolvers,
  });
};

const setUpSpaceUsageApiTestInstance = async (controllerParams) => {
  await connectToSpaceUsageDb();

  const spaceUsageApi = setUpSpaceUsageApi(controllerParams);

  const spaceUsageApiInstance = await spaceUsageApi.start({
    debug: false,
  });

  const spaceUsageApiRequest = request('http://localhost:4000');

  return { spaceUsageApiInstance, request: spaceUsageApiRequest };
};

module.exports = setUpSpaceUsageApiTestInstance;
