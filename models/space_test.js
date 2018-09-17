
const { expect } = require('chai');
const mongoose = require('mongoose');
const { getConfigForEnvironment } = require('../config/config.js');
const Space = require('./space.js');

describe('space', () => {
  let config;
  let mockSpace;

  const ensureSpaceCollectionEmpty = async () => {
    const spaces = await Space.find({});

    if (spaces.length) {
      await Space.collection.drop();
    }
  };

  const doesSaveSpaceThrowError = async () => {
    const mongooseSpaceBeforeSave = new Space(mockSpace);
    try {
      await mongooseSpaceBeforeSave.save();
      return false;
    } catch (error) {
      return true;
    }
  };

  before(async () => {
    config = getConfigForEnvironment(process.env.NODE_ENV);
    await mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });
  });

  beforeEach(async () => {
    await ensureSpaceCollectionEmpty();

    mockSpace = {
      _id: '1AD',
      name: 'Meeting room 1',
      occupancyCapacity: 8,
      siteId: '1',
    };
  });

  after(async () => {
    await ensureSpaceCollectionEmpty();
    await mongoose.connection.close();
  });

  it('should save space when validation is successful', async function () {
    const space = new Space(mockSpace);
    const savedSpace = await space.save();

    expect(savedSpace._id).to.equal(mockSpace._id);
    expect(savedSpace.name).to.equal(mockSpace.name);
    expect(savedSpace.occupancyCapacity).to.equal(mockSpace.occupancyCapacity);
    expect(savedSpace.siteId).to.equal(mockSpace.siteId);
  });

  it('should reject save if id not provided', async function () {
    mockSpace._id = '';
    const wasErrorThrown = await doesSaveSpaceThrowError();

    expect(wasErrorThrown).to.equal(true);
  });

  it('should reject save if name not provided', async function () {
    mockSpace.name = '';
    const wasErrorThrown = await doesSaveSpaceThrowError();

    expect(wasErrorThrown).to.equal(true);
  });

  it('should reject save if occupancyCapacity not provided', async function () {
    mockSpace.occupancyCapacity = '';
    const wasErrorThrown = await doesSaveSpaceThrowError();

    expect(wasErrorThrown).to.equal(true);
  });

  it('should reject save if siteId not provided', async function () {
    mockSpace.siteId = '';
    const wasErrorThrown = await doesSaveSpaceThrowError();

    expect(wasErrorThrown).to.equal(true);
  });
});

