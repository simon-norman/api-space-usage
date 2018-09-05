
const config = {
  development: {
    spaceUsageDatabase: {
      uri: 'mongodb://localhost:27017/space_usage_dev',
    },
  },

  test: {
    spaceUsageDatabase: {
      uri: process.env.MONGODB_URI,
    },
  },

  qa: {
    spaceUsageDatabase: {
      uri: process.env.MONGODB_URI,
    },
  },

  production: {
    spaceUsageDatabase: {
      uri: process.env.MONGODB_URI,
    },
  },
};

const getConfigForEnvironment = (environment) => {
  if (config[environment]) {
    return config[environment];
  }
  throw new Error(`Environment titled ${environment} was not found`);
};

module.exports = { getConfigForEnvironment };
