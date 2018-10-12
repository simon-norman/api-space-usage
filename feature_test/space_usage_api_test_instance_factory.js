const { readFileSync } = require('fs');
const { GraphQLServer } = require('graphql-yoga');
let request = require('supertest');

const setUpSpaceUsageApiTestInstance = async ({
  controllerFactory, controllerFactoryDependencies,
}) => {
  const { typeDefs, resolvers } = controllerFactory(...controllerFactoryDependencies);
  const spaceUsageDataSchema = readFileSync('graphql_schema/space_usage_schema.graphql', 'utf8');

  const spaceUsageApi = new GraphQLServer({
    typeDefs: [spaceUsageDataSchema, typeDefs],
    resolvers,
  });

  const spaceUsageApiInstance = await spaceUsageApi.start({
    debug: false,
  });

  request = request('http://localhost:4000');

  return { spaceUsageApiInstance, request };
};

module.exports = setUpSpaceUsageApiTestInstance;
