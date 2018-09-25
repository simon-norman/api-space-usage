
const { GraphQLServer } = require('graphql-yoga');

const typeDefs = `
type Query {
  spaceUsagesById(spaceIds: [String]): [SpaceUsage!]!
}

type SpaceUsage {
  spaceId: Int!
  description: String!
}
`;

const spaceUsages = [
  {
    spaceId: '1',
    description: 'some usage',
  },
  {
    spaceId: '2',
    description: 'some usage 2',
  },
];


const resolvers = {
  Query: {
    spaceUsagesById: (_, spaceId) => {
      return spaceUsages;
    },
  },
};


const server = new GraphQLServer({
  typeDefs,
  resolvers,
});
server.start(() => console.log('Server is running on http://localhost:4000'));

