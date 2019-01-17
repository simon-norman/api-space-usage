
const ensureCollectionEmpty = require('../helpers/mongo_collection_drop');
const Space = require('../../models/space_model');

const setUpTestSpacesInDb = async ({ numberOfSpaces }) => {
  await ensureCollectionEmpty(Space);

  const testSpaces = [];

  for (let spaceId = 0; spaceId < numberOfSpaces; spaceId += 1) {
    testSpaces.push({
      _id: spaceId.toString(),
      name: `Space${spaceId}`,
      category: 'Meeting room',
      occupancyCapacity: 5,
    });
  }

  await Space.insertMany(testSpaces);
  return testSpaces;
};

module.exports = setUpTestSpacesInDb;
