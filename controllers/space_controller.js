
module.exports = (Space) => {
  const typeDefs = `
    type Query {
      GetAllSpaces: [Space!]
    }
  `;

  const resolvers = {
    Query: {
      GetAllSpaces: async () => {
        const spaces = await Space.find({});

        if (spaces.length) {
          return spaces;
        }
        throw new Error('No spaces found');
      },
    },
  };


  return { typeDefs, resolvers };
};

