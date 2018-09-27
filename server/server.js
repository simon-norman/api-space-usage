
const { GraphQLServer } = require('graphql-yoga');

const typeDefs = `
type Query {
  spaceUsagesBySiteId(siteId: String): [SpaceUsage!]!
}

type SpaceUsage {
  _id: String!
  spaceId: String!
  usagePeriodStartTime: String!
  usagePeriodEndTime: String!
  numberOfPeopleRecorded: Int!
}

input SpaceUsageInput {
  spaceId: String!
  usagePeriodStartTime: String!
  usagePeriodEndTime: String!
  numberOfPeopleRecorded: Int!
}

type Mutation {
  CreateSpaceUsage(input: SpaceUsageInput): SpaceUsage!
}
`;

const resolvers = {
  Query: {
    spaceUsagesBySiteId: async (_, request) => {
      console.log('stuff');
    },
  },

  Mutation: {
    CreateSpaceUsage: async (_, request) => {
      console.log('stuff');
    },
  },
};


const server = new GraphQLServer({
  typeDefs,
  resolvers,
});
server.start(() => console.log('Server is running on http://localhost:4000'));

