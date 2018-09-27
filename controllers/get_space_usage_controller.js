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

  const getMongoStagesToFilterClientsBySiteId = siteIdAsMongoId => [
    {
      $match: {
        'sites._id': siteIdAsMongoId,
      },
    },
  ];

  const mongoStagesToUnwindNestedSitesFloors = [
    { $unwind: '$sites' },
    { $unwind: '$sites.floors' },
  ];

  const mongoStagesToGroupSpaceIdsFromClientsIntoOneDoc = [
    { $group: { _id: undefined, spaceIds: { $addToSet: '$sites.floors.spaceIds' } } },
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
  ];

  const getMongoQueryToGetSpaceIdsForSiteId = (siteIdAsMongoId) => {
    const queryToGetSpaceIdsFromDiffClients = [
      ...getMongoStagesToFilterClientsBySiteId(siteIdAsMongoId),
      ...mongoStagesToUnwindNestedSitesFloors,
      ...mongoStagesToGroupSpaceIdsFromClientsIntoOneDoc,
    ];

    return queryToGetSpaceIdsFromDiffClients;
  };

  const resolvers = {
    Query: {
      spaceUsagesBySiteId: async (_, query) => {
        try {
          const siteIdAsMongoId = mongoose.Types.ObjectId(query.siteId);

          const queryToGetSpaceIdsForSiteId = getMongoQueryToGetSpaceIdsForSiteId(siteIdAsMongoId);
          const siteWithAllSpaceIds = await Client.aggregate(queryToGetSpaceIdsForSiteId);
          const spaceIdsForSite = siteWithAllSpaceIds[0].spaceIds;

          const spaceUsages = await SpaceUsage.find({ spaceId: { $in: spaceIdsForSite } });

          const spaceUsagesWithDatesFormattedUtc = JSON.parse(JSON.stringify(spaceUsages));
          return spaceUsagesWithDatesFormattedUtc;
        } catch (error) {
          return error;
        }
      },
    },
  };


  return { typeDefs, resolvers };
};

