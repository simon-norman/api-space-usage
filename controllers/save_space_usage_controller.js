

module.exports = (SpaceUsage) => {
  const typeDefs = `
    type Query {
      dummy: String
    }

    type Mutation {
      CreateSpaceUsage(input: SpaceUsageInput): SpaceUsage!
    }
  `;

  const convertDatesInObjectToUtcString = (object) => {
    const convertedObject = Object.assign({}, object);
    for (const key in object) {
      if (object[key] instanceof Date) {
        convertedObject[key] = object[key].toUTCString();
      }
    }

    return convertedObject;
  };

  const resolvers = {
    Mutation: {
      CreateSpaceUsage: async (_, { input }) => {
        let savedSpaceUsage = await SpaceUsage.findByIdAndUpdate(
          input._id,
          input,
          {
            runValidators: true,
          },
        );

        if (!savedSpaceUsage) {
          const spaceUsageToBeSaved = new SpaceUsage(input);
          savedSpaceUsage = await spaceUsageToBeSaved.save();
        }

        return convertDatesInObjectToUtcString(savedSpaceUsage._doc);
      },
    },
  };


  return { typeDefs, resolvers };
};

