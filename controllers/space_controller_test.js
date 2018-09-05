
const { expect } = require('chai');


describe('space_controller', () => {
  describe('Get spaces', () => {
    beforeEach(() => {
      setMockRecordingToBeSaved();

      setUpMockRecordingModelWithSpies();

      RecordingControllerStamp =
        RecordingControllerStampFactory(MockRecordingModel);

      recordingController = RecordingControllerStamp();
    });

    it('should retrieve all spaces for the specified site id', async function () {
      const retrievedSpaces = spaceController.getSpaces();

      expect(retrievedSpaces).to.deep.equal(mockSpaces);
    });
  });
});

