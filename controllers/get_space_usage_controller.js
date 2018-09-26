const mongoose = require('mongoose');


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
      spaceUsagesBySiteId: async (_, query) => {
        try {
          const siteIdAsMongoId = mongoose.Types.ObjectId(query.siteId);
          const clientsForSite = await Client.aggregate([
            { $unwind: '$sites' },
            {
              $match: {
                'sites._id': siteIdAsMongoId,
              },
            },
            { $unwind: '$sites.floors' },
            { $replaceRoot: { newRoot: '$sites.floors' } },
          ]);
          return 'stuff';
        } catch (error) {
          return error;
        }
      },
    },
  };


  return { typeDefs, resolvers };
};

