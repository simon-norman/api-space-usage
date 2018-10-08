
module.exports = (Client, SpaceUsage) => {
  const typeDefs = `
    type Query {
      SpaceUsagesBySiteId(siteId: String): [SpaceUsageAnalysisData!]!
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

  const getMongoStagesToFilterSitesBySiteId = siteIdAsMongoId => [
    {
      $match: {
        'sites._id': siteIdAsMongoId,
      },
    },
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

  const getAllSpaceIdsForSite = async (siteId) => {
    const mongoQueryToGetSpaceIdsForSpecificSite = [
      ...getMongoStagesToFilterClientsBySiteId(siteId),
      ...mongoStagesToUnwindNestedSitesFloors,
      ...getMongoStagesToFilterSitesBySiteId(siteId),
      ...mongoStagesToGroupSpaceIdsFromClientsIntoOneDoc,
    ];

    const siteWithAllSpaceIds = await Client.aggregate(mongoQueryToGetSpaceIdsForSpecificSite);
    return siteWithAllSpaceIds;
  };

  const getSpaceUsagesJoinedWithSpaces = async spaceIds =>
    SpaceUsage.aggregate(([{ $match: { spaceId: { $in: spaceIds } } },
      {
        $lookup: {
          from: 'spaces',
          localField: 'spaceId',
          foreignField: '_id',
          as: 'spaceInfo',
        },
      },
      {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$spaceInfo', 0] }, '$$ROOT'] } },
      },
      { $addFields: { spaceName: '$name' } },
      { $project: { spaceInfo: 0, numberOfPeopleRecorded: 0, name: 0 } }]));

  const resolvers = {
    Query: {
      SpaceUsagesBySiteId: async (_, query) => {
        const siteWithAllSpaceIds = await getAllSpaceIdsForSite(query.siteId);
        const spaceIdsForSite = siteWithAllSpaceIds[0].spaceIds;

        const spaceUsagesJoinedWithSpaces = await getSpaceUsagesJoinedWithSpaces(spaceIdsForSite);
        return spaceUsagesJoinedWithSpaces;
      },
    },
  };


  return { typeDefs, resolvers };
};

