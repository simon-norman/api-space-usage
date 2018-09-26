
const typeDefs = `
type Query {
  spaceUsagesById(spaceIds: [String]): [SpaceUsage!]!
}

type SpaceUsage {
  spaceId: Int!
  description: String!
}
`;

const resolvers = {
  Query: {
    spaceUsagesById: (_, spaceId) => spaceUsages,
  },
};

module.exports = { typeDefs, resolvers };
