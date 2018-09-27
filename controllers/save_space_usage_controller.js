

module.exports = (SpaceUsage) => {
  const typeDefs = `
    type Query {
      dummy: String
    }

    type Mutation {
      CreateSpaceUsage(input: SpaceUsageInput): SpaceUsage!
    }

    type SpaceUsage {
      _id: String!
      spaceId: String!
      usagePeriodStartTime: Float!
      usagePeriodEndTime: Float!
      numberOfPeopleRecorded: Int!
    }

    input SpaceUsageInput {
      spaceId: String!
      usagePeriodStartTime: Float!
      usagePeriodEndTime: Float!
      numberOfPeopleRecorded: Int!
    }
  `;

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
          savedSpaceUsage = new SpaceUsage(input);
          savedSpaceUsage = await savedSpaceUsage.save();
        }

        return savedSpaceUsage;
      },
    },
  };


  return { typeDefs, resolvers };
};

