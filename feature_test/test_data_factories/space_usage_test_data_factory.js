const SpaceUsage = require('../../models/space_usage_model');

const setUpTestSpaceUsagesInDb = async ({ mockSpaces }) => {
  const mockSpaceUsages = [];

  for (const mockSpace of mockSpaces) {
    const fourHoursInMilSecs = (4 * 60 * 60 * 1000);
    for (
      let usagePeriodStartTime = new Date('October 10, 2010 00:00:00').getTime();
      usagePeriodStartTime < new Date('October 11, 2010 00:00:00').getTime();
      usagePeriodStartTime += fourHoursInMilSecs
    ) {
      mockSpaceUsages.push({
        spaceId: mockSpace._id,
        usagePeriodStartTime: new Date(usagePeriodStartTime),
        usagePeriodEndTime: new Date(usagePeriodStartTime + fourHoursInMilSecs),
        numberOfPeopleRecorded: 5,
        occupancy: 0.9,
      });
    }
  }

  const mockSavedSpaceUsages = await SpaceUsage.insertMany(mockSpaceUsages);
  return mockSavedSpaceUsages;
};

module.exports = setUpTestSpaceUsagesInDb;
