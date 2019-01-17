
const ensureCollectionEmpty = async (model) => {
  const collectionRecords = await model.find({});
  if (collectionRecords.length) {
    await model.collection.drop();
  }
};

module.exports = ensureCollectionEmpty;
