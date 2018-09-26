
module.exports = (Client, SpaceUsage) => {
  const typeDefs = `
    type Query {
      spaceUsagesBySiteId(siteId: String): [SpaceUsage!]!
    }

    type SpaceUsage {
      spaceId: String!
      usagePeriodStartTime: String!
      usagePeriodEndTime: String!
      numberOfPeopleRecorded: Int!
    }
  `;

  const resolvers = {
    Query: {
      spaceUsagesBySiteId: async (_, siteId) => {
        const clientsForSite = await Client.find({ 'sites._id': siteId });
        return 'stuff';
      },
    },
  };


  return { typeDefs, resolvers };
};

