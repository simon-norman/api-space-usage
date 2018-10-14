const SpaceUsage = require('../../models/space_usage_model');
const ensureCollectionEmpty = require('../helpers/mongo_collection_drop');

const setUpTestSpaceUsagesInDb = async ({ testSpaces }) => {
  await ensureCollectionEmpty(SpaceUsage);

  const testSpaceUsages = [];

  for (const testSpace of testSpaces) {
    const fourHoursInMilSecs = (4 * 60 * 60 * 1000);
    for (
      let usagePeriodStartTime = new Date('October 10, 2010 00:00:00 GMT').getTime();
      usagePeriodStartTime < new Date('October 11, 2010 00:00:00 GMT').getTime();
      usagePeriodStartTime += fourHoursInMilSecs
    ) {
      testSpaceUsages.push({
        spaceId: testSpace._id,
        usagePeriodStartTime: new Date(usagePeriodStartTime),
        usagePeriodEndTime: new Date(usagePeriodStartTime + fourHoursInMilSecs),
        numberOfPeopleRecorded: 5,
        occupancy: 0.9,
      });
    }
  }

  const testSavedSpaceUsages = await SpaceUsage.insertMany(testSpaceUsages);
  return testSavedSpaceUsages;
};

module.exports = setUpTestSpaceUsagesInDb;
