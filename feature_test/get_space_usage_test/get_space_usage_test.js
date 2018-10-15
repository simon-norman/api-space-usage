
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Client = require('../../models/client_model');
const GetSpaceUsageControllerFactory = require('../../controllers/get_space_usage_controller');
const SpaceUsage = require('../../models/space_usage_model');
const getExpectedSpaceUsagesWithSpaceInfo = require('./expected_space_usages_getter');
const setUpSpaceUsageApiTestInstance = require('./../space_usage_api_test_instance_factory');
const { setUpTestClientInDb } = require('./../test_data_factories/client_test_data_factory');
const setUpTestSpacesInDb = require('./../test_data_factories/space_test_data_factory');
const setUpTestSpaceUsagesInDb = require('./../test_data_factories/space_usage_test_data_factory');

const { expect } = chai;
const sinonSandbox = sinon.sandbox.create();

describe('Consumer requests space usage data,', () => {
  let spaceUsageApiInstance;
  let request;
  let expectedSpaceUsagesWithSpaceInfo;
  let getSpaceUsageQueryString;

  const setUpGetSpaceUsageQueryString = (queryParams) => {
    getSpaceUsageQueryString = `{ SpaceUsagesWithSpaceInfo(
      siteId: "${queryParams.siteIdToQuerySpaceUsage}",
      dayStartTime: "${queryParams.dayStartTimeToQuerySpaceUsage}",
      dayEndTime: "${queryParams.dayEndTimeToQuerySpaceUsage}"
      ) {
      spaceId
      spaceName
      spaceCategory
      usagePeriodStartTime
      usagePeriodEndTime
      occupancy
      numberOfPeopleRecorded
    }}`;
  };

  before(async () => {
    ({ request, spaceUsageApiInstance } = await setUpSpaceUsageApiTestInstance({
      controllerFactory: GetSpaceUsageControllerFactory,
      controllerFactoryDependencies: [Client, SpaceUsage],
    }));
  });

  beforeEach(async () => {
    const testSpaces = await setUpTestSpacesInDb({ numberOfSpaces: 4 });

    const testClient = await setUpTestClientInDb({
      site1TestSpaceIds: [testSpaces[0]._id, testSpaces[1]._id],
      site2GroundFloorTestSpaceIds: [testSpaces[2]._id],
      site2FirstFloorTestSpaceIds: testSpaces[3]._id,
    });

    const testSpaceUsages = await setUpTestSpaceUsagesInDb({ testSpaces });

    const dayStartTimeToQuerySpaceUsage = '08:00:00 GMT';
    const dayEndTimeToQuerySpaceUsage = '18:00:00 GMT';

    const getSpaceUsageQueryParams = {
      siteIdToQuerySpaceUsage: testClient.sites[1]._id,
      dayStartTimeToQuerySpaceUsage,
      dayEndTimeToQuerySpaceUsage,
    };
    setUpGetSpaceUsageQueryString(getSpaceUsageQueryParams);

    const expectedSpaces = [testSpaces[2], testSpaces[3]];
    expectedSpaceUsagesWithSpaceInfo = await getExpectedSpaceUsagesWithSpaceInfo({
      testSpaceUsages, expectedSpaces, dayStartTimeToQuerySpaceUsage, dayEndTimeToQuerySpaceUsage,
    });
  });

  afterEach(() => {
    sinonSandbox.restore();
  });

  after(async () => {
    await spaceUsageApiInstance.close();
    await mongoose.connection.close();
  });

  context('given that the consumer has specified a valid siteId, dayStartTime, and dayEndTime (times as date strings)', async function () {
    it('should then retrieve all space usages for that site id and timeframe', async function () {
      const response = await request
        .post('/')
        .send({
          query: getSpaceUsageQueryString,
        });

      expect(response.body.data.SpaceUsagesWithSpaceInfo)
        .deep.equals(expectedSpaceUsagesWithSpaceInfo);
    });

    context('when the database query throws an error', async function () {
      it('should then return the error message in the response', async function () {
        const stubbedAggregate = sinonSandbox.stub(Client, 'aggregate');
        const errorMessage = 'error message';
        stubbedAggregate.throws(new Error(errorMessage));

        const response = await request
          .post('/')
          .send({
            query: getSpaceUsageQueryString,
          });

        expect(response.body.errors[0].message).equals(errorMessage);
      });
    });
  });
});

