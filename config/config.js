
const config = {
  development: {
    webServer: {
      port: 3000,
    },
    spaceUsageDatabase: {
      uri: 'mongodb://localhost:27017/space_usage_dev',
    },
  },

  test: {
    webServer: {
      port: process.env.PORT,
    },
    spaceUsageDatabase: {
      uri: process.env.SPACE_USAGE_DATABASE_URI,
    },
  },

  qa: {
    webServer: {
      port: process.env.PORT,
    },
    spaceUsageDatabase: {
      uri: process.env.SPACE_USAGE_DATABASE_URI,
    },
  },

  production: {
    webServer: {
      port: process.env.PORT,
    },
    spaceUsageDatabase: {
      uri: process.env.SPACE_USAGE_DATABASE_URI,
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
