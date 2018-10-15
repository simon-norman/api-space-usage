
module.exports = (Client, SpaceUsage) => {
  const typeDefs = `
    type Query {
      SpaceUsagesWithSpaceInfo(
        siteId: String,
        dayStartTime: String,
        dayEndTime: String
        ): [SpaceUsagesWithSpaceInfo!]!
    }
  `;

  const getMongoStagesToFilterDocsBySiteId = siteIdAsMongoId => [
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

  const getAllSpaceIdsForSite = async (siteId) => {
    const mongoQueryToGetSpaceIdsForSpecificSite = [
      ...getMongoStagesToFilterDocsBySiteId(siteId),
      ...mongoStagesToUnwindNestedSitesFloors,
      // First filter out clients by site id, then the unwound sites by site id
      ...getMongoStagesToFilterDocsBySiteId(siteId),
      ...mongoStagesToGroupSpaceIdsFromClientsIntoOneDoc,
    ];

    const siteWithAllSpaceIds = await Client.aggregate(mongoQueryToGetSpaceIdsForSpecificSite);
    return siteWithAllSpaceIds;
  };

  const getMongoStagesToFilterSpaceUsagesByUsagePeriod = (dayStartTime, dayEndTime) => [
    {
      $addFields: {
        usagePeriodStartTimeWithOnlyTime: {
          $dateToString: { date: '$usagePeriodStartTime', format: '%H:%M:%S:%L' },
        },
        usagePeriodEndTimeWithOnlyTime: {
          $dateToString: { date: '$usagePeriodEndTime', format: '%H:%M:%S:%L' },
        },
      },
    },
    {
      $match: {
        usagePeriodStartTimeWithOnlyTime: { $gte: dayStartTime, $lte: dayEndTime },
        usagePeriodEndTimeWithOnlyTime: { $gte: dayStartTime, $lte: dayEndTime },
      },
    },
  ];

  const getMongoStagesToGetJoinedSpaceAndSpaceUsages = spaceIds => [
    { $match: { spaceId: { $in: spaceIds } } },
    {
      $lookup: {
        from: 'spaces',
        localField: 'spaceId',
        foreignField: '_id',
        as: 'spaceInfo',
      },
    },
  ];

  const mongoStagesToMoveSpaceInfoToRootOfDocs = [
    {
      $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$spaceInfo', 0] }, '$$ROOT'] } },
    },
    { $addFields: { spaceName: '$name', spaceCategory: '$category' } },
  ];

  const mongoStagesToRemoveUnwantedSpaceUsageSpaceInfoData = [
    {
      $project: {
        spaceInfo: 0,
        name: 0,
        category: 0,
        usagePeriodStartTimeWithOnlyTime: 0,
        usagePeriodEndTimeWithOnlyTime: 0,
      },
    },
  ];

  const mongoStagesToReturnUsagePeriodTimesAsUtcString = [
    {
      $addFields: {
        usagePeriodStartTime: { $dateToString: { date: '$usagePeriodStartTime', timezone: 'GMT' } },
        usagePeriodEndTime: { $dateToString: { date: '$usagePeriodEndTime', timezone: 'GMT' } },
      },
    },
  ];

  const getSpaceUsageAnalysisDataBySpaceIdsAndUsagePeriod
    = async (spaceIds, dayStartTime, dayEndTime) => {
      const mongoQueryToGetSpaceUsageAnalysisData = [
        ...getMongoStagesToFilterSpaceUsagesByUsagePeriod(dayStartTime, dayEndTime),
        ...getMongoStagesToGetJoinedSpaceAndSpaceUsages(spaceIds),
        ...mongoStagesToReturnUsagePeriodTimesAsUtcString,
        ...mongoStagesToMoveSpaceInfoToRootOfDocs,
        ...mongoStagesToRemoveUnwantedSpaceUsageSpaceInfoData,
      ];

      const siteWithAllSpaceIds = await SpaceUsage.aggregate(mongoQueryToGetSpaceUsageAnalysisData);
      return siteWithAllSpaceIds;
    };

  const resolvers = {
    Query: {
      SpaceUsagesWithSpaceInfo: async (_, query) => {
        const siteWithAllSpaceIds = await getAllSpaceIdsForSite(query.siteId);
        const spaceIdsForSite = siteWithAllSpaceIds[0].spaceIds;

        const spaceUsagesJoinedWithSpaces = await getSpaceUsageAnalysisDataBySpaceIdsAndUsagePeriod(
          spaceIdsForSite,
          query.dayStartTime,
          query.dayEndTime,
        );

        return spaceUsagesJoinedWithSpaces;
      },
    },
  };


  return { typeDefs, resolvers };
};

