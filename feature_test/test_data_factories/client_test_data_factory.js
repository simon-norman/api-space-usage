const ensureCollectionEmpty = require('../helpers/mongo_collection_drop');
const Client = require('../../models/client_model');

const setUpTestClient = ({
  site1TestSpaceIds,
  site2GroundFloorTestSpaceIds,
  site2FirstFloorTestSpaceIds,
}) => ({
  name: 'ABC Inc',
  sites: [
    {
      _id: '1',
      name: 'Site 1',
      floors: [
        { name: 'Ground floor', spaceIds: site1TestSpaceIds },
      ],
    },
    {
      _id: '2',
      name: 'Site 2',
      floors: [
        { name: 'Ground floor', spaceIds: site2GroundFloorTestSpaceIds },
        { name: 'First floor', spaceIds: site2FirstFloorTestSpaceIds },
      ],
    },
  ],
});

const setUpTestClientInDb = async (testClientParams) => {
  await ensureCollectionEmpty(Client);

  const savedTestClient = await new Client(setUpTestClient(testClientParams)).save();
  return savedTestClient;
};

module.exports = { setUpTestClientInDb };
