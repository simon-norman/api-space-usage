
const { GraphQLServer } = require('graphql-yoga');
const { mergeTypes, mergeResolvers } = require('merge-graphql-schemas');

module.exports = async (
  getSpaceUsageController,
  saveSpaceUsageController,
  spaceController,
  spaceUsageDataSchema,
) => {
  const types = [
    spaceUsageDataSchema,
    getSpaceUsageController.typeDefs,
    saveSpaceUsageController.typeDefs,
    spaceController.typeDefs,
  ];
  const mergedTypes = mergeTypes(types, { all: true });

  const resolvers = [
    getSpaceUsageController.resolvers,
    saveSpaceUsageController.resolvers,
    spaceController.resolvers,
  ];
  const mergedResolvers = mergeResolvers(resolvers, { all: true });

  const server = new GraphQLServer({
    typeDefs: mergedTypes,
    resolvers: mergedResolvers,
  });

  await server.start({ debug: false });

  return server;
};
