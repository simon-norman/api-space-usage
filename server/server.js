
const { GraphQLServer } = require('graphql-yoga');

module.exports = async (
  getSpaceUsageController,
  saveSpaceUsageController,
  spaceController,
  spaceUsageDataSchema
) => {
  const server = new GraphQLServer({
    typeDefs: [
      spaceUsageDataSchema,
      getSpaceUsageController.typeDefs,
      saveSpaceUsageController.typeDefs,
      spaceController.typeDefs,
    ],
    resolvers: [
      getSpaceUsageController.resolvers,
      saveSpaceUsageController.resolvers,
      spaceController.resolvers,
    ],
  });

  await server.start({ debug: false });

  return server;
};
