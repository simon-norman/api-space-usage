
const config = {
  development: {
    webServer: {
      port: 3001,
    },
    spaceUsageDatabase: {
      uri: 'mongodb://localhost:27017/space_usage_dev',
    },
    errorLogging: {
      environment: '',
      ravenConfig: {
        dsn: process.env.RAVEN_DSN,
        options: {
          captureUnhandledRejections: true,
        },
      },
    },
  },

  test: {
    webServer: {
      port: process.env.PORT,
    },
    spaceUsageDatabase: {
      uri: process.env.SPACE_USAGE_DATABASE_URI,
    },
    errorLogging: {
      environment: '',
      ravenConfig: {
        dsn: process.env.RAVEN_DSN,
        options: {
          captureUnhandledRejections: true,
        },
      },
    },
  },

  qa: {
    webServer: {
      port: process.env.PORT,
    },
    spaceUsageDatabase: {
      uri: process.env.SPACE_USAGE_DATABASE_URI,
    },
    errorLogging: {
      environment: '',
      ravenConfig: {
        dsn: process.env.RAVEN_DSN,
        options: {
          captureUnhandledRejections: true,
        },
      },
    },
  },

  production: {
    webServer: {
      port: process.env.PORT,
    },
    spaceUsageDatabase: {
      uri: process.env.SPACE_USAGE_DATABASE_URI,
    },
    errorLogging: {
      environment: '',
      ravenConfig: {
        dsn: process.env.RAVEN_DSN,
        options: {
          captureUnhandledRejections: true,
        },
      },
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
