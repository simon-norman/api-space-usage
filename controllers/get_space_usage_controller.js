const mongoose = require('mongoose');


module.exports = (Client, SpaceUsage) => {
  const typeDefs = `
    type Query {
      SpaceUsagesBySiteId(siteId: String): [SpaceUsage!]!
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
      SpaceUsagesBySiteId: async (_, query) => {
        console.log('reached space usages controller');
        const siteIdAsMongoId = mongoose.Types.ObjectId(query.siteId);

        console.log('about to get mongo query');
        const queryToGetSpaceIdsForSiteId = getMongoQueryToGetSpaceIdsForSiteId(siteIdAsMongoId);
        console.log('about to get space ids');
        const siteWithAllSpaceIds = await Client.aggregate(queryToGetSpaceIdsForSiteId);
        console.log('preparing to extract space ids from object');

        const spaceIdsForSite = siteWithAllSpaceIds[0].spaceIds;

        console.log('preparing to find space usages');
        const spaceUsages = await SpaceUsage.find({ spaceId: { $in: spaceIdsForSite } });

        console.log(spaceUsages);
        return spaceUsages;
      },
    },
  };


  return { typeDefs, resolvers };
};

