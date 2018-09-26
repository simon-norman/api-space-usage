const mongoose = require('mongoose');


module.exports = (Client, SpaceUsage) => {
  const typeDefs = `
    type Query {
      spaceUsagesBySiteId(siteId: String): [SpaceUsage!]!
    }

    type SpaceUsage {
      _id: String!
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

          const siteWithAllSpaceIds = await Client.aggregate([
            { $unwind: '$sites' },
            {
              $match: {
                'sites._id': siteIdAsMongoId,
              },
            },
            { $unwind: '$sites.floors' },
            { $group: { _id: query.siteId, spaceIds: { $addToSet: '$sites.floors.spaceIds' } } },
            {
              $project: {
                spaceIds: {
                  $reduce: {
                    input: '$spaceIds',
                    initialValue: [],
                    in: { $setUnion: ['$$value', '$$this'] },
                  },
                },
              },
            },
          ]);

          const spaceIdsForSite = siteWithAllSpaceIds[0].spaceIds;
          const spaceUsages = await SpaceUsage.find({ spaceId: { $in: spaceIdsForSite } });

          const spaceUsagesWithUtcDate = JSON.parse(JSON.stringify(spaceUsages));
          return spaceUsagesWithUtcDate;
        } catch (error) {
          return error;
        }
      },
    },
  };


  return { typeDefs, resolvers };
};

