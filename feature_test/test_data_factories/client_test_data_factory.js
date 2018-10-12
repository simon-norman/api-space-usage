const setUpTestClient = ({
  site1MockSpaceIds,
  site2GroundFloorMockSpaceIds,
  site2FirstFloorMockSpaceIds,
}) => ({
  name: 'ABC Inc',
  sites: [
    {
      _id: '1',
      name: 'Site 1',
      floors: [
        { name: 'Ground floor', spaceIds: site1MockSpaceIds },
      ],
    },
    {
      _id: '2',
      name: 'Site 2',
      floors: [
        { name: 'Ground floor', spaceIds: site2GroundFloorMockSpaceIds },
        { name: 'First floor', spaceIds: site2FirstFloorMockSpaceIds },
      ],
    },
  ],
});

module.exports = setUpTestClient;
