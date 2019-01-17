
const convertMongoDocsToGraphQlResponse = (mongoDocs, fieldsToRemove) => {
  const convertedMongoDocs = JSON.parse(JSON.stringify(mongoDocs));
  for (const convertedMongoDoc of convertedMongoDocs) {
    for (const fieldToRemove of fieldsToRemove) {
      delete convertedMongoDoc[fieldToRemove];
    }
  }

  return convertedMongoDocs;
};

module.exports = convertMongoDocsToGraphQlResponse;
