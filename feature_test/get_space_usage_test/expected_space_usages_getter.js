const convertMongoDocsToGraphQlResponse = require('./../helpers/mongo_doc_to_graphql_response_converter');

const filterSpaceUsagesBySpaceIdAndUsagePeriod = ({
  testSpaceUsages,
  expectedSpaces,
  dayStartTimeToQuerySpaceUsage,
  dayEndTimeToQuerySpaceUsage,
}) =>
  testSpaceUsages.filter(spaceUsage =>
    expectedSpaces.some(space => space._id === spaceUsage.spaceId) &&

    spaceUsage.usagePeriodStartTime.toTimeString() >= dayStartTimeToQuerySpaceUsage &&
    spaceUsage.usagePeriodStartTime.toTimeString() <= dayEndTimeToQuerySpaceUsage &&

    spaceUsage.usagePeriodEndTime.toTimeString() >= dayStartTimeToQuerySpaceUsage &&
    spaceUsage.usagePeriodEndTime.toTimeString() <= dayEndTimeToQuerySpaceUsage);

const addSpaceInfoToExpectedSpaceUsages = ({ expectedSpaceUsages, expectedSpaces }) =>
  expectedSpaceUsages.map((spaceUsage) => {
    const spaceUsageWithSpaceInfo = Object.assign({}, spaceUsage);

    const matchingSpaces = expectedSpaces.filter(space => space._id === spaceUsage.spaceId);
    spaceUsageWithSpaceInfo.spaceName = matchingSpaces[0].name;
    spaceUsageWithSpaceInfo.spaceCategory = matchingSpaces[0].category;

    return spaceUsageWithSpaceInfo;
  });

const getExpectedSpaceUsagesWithSpaceInfo = async (params) => {
  const expectedSpaceUsagesWithMongoData
    = filterSpaceUsagesBySpaceIdAndUsagePeriod(params);

  const mongoFieldsToRemove = ['_id', '__v'];
  const expectedSpaceUsages
  = convertMongoDocsToGraphQlResponse(expectedSpaceUsagesWithMongoData, mongoFieldsToRemove);

  return addSpaceInfoToExpectedSpaceUsages({
    expectedSpaceUsages, expectedSpaces: params.expectedSpaces,
  });
};

module.exports = getExpectedSpaceUsagesWithSpaceInfo;
