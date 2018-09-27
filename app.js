
const { wireUpApp } = require('./dependency_injection/app_wiring');
const { getConfigForEnvironment } = require('./config/config.js');
const RavenWrapperFactory = require('raven-wrapper');
const mongoose = require('mongoose');

let config;
let app;

const connectToDatabase = () =>
  mongoose.connect(config.spaceUsageDatabase.uri, { useNewUrlParser: true });

const startApp = async () => {
  wireUpApp();

  config = getConfigForEnvironment(process.env.NODE_ENV);

  await connectToDatabase();
};

const errorLoggingConfig = getConfigForEnvironment(process.env.NODE_ENV).errorLogging;
errorLoggingConfig.environment = process.env.NODE_ENV;
const { wrapperToHandleUnhandledExceptions } = RavenWrapperFactory(errorLoggingConfig);

wrapperToHandleUnhandledExceptions(() => {
  startApp();
});

module.exports = app;
