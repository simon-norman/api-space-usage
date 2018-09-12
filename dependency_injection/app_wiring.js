
const DependencyNotFoundError = require('../services/error_handling/errors/DependencyNotFoundError');
const DependencyAlreadyRegisteredError = require('../services/error_handling/errors/DependencyAlreadyRegisteredError');
const DiContainerStampFactory = require('./di_container');
const DiContainerInclStampsStampFactory = require('./di_container_incl_stamps');
const LoggerFactory = require('../services/error_handling/logger/logger.js');
const Space = require('../models/space');
const SpaceUsage = require('../models/space_usage');
const GetRecordingControllerFactory = require('../controllers/get_recording_controller');
const RecordingRoutesFactory = require('../routes/recording_routes');
const RoutesFactory = require('../routes/index');

let diContainer;
let registerDependency;
let registerDependencyFromFactory;

const getFunctionsFromDiContainer = () => {
  ({
    registerDependency,
    registerDependencyFromFactory,
  } = diContainer);

  registerDependency = registerDependency.bind(diContainer);
  registerDependencyFromFactory = registerDependencyFromFactory.bind(diContainer);
};

const setUpDiContainer = () => {
  const DiContainerStamp = DiContainerStampFactory(
    DependencyNotFoundError,
    DependencyAlreadyRegisteredError,
  );
  const DiContainerInclStampsStamp = DiContainerInclStampsStampFactory(DiContainerStamp);

  diContainer = DiContainerInclStampsStamp();
  getFunctionsFromDiContainer();
};

const registerRecordingRoutes = () => {
  registerDependency('Recording', Recording);
  registerDependencyFromFactory('getRecordingController', GetRecordingControllerFactory);
  registerDependencyFromFactory('recordingRoutes', RecordingRoutesFactory);
};

const registerRoutes = () => {
  registerRecordingRoutes();

  registerDependencyFromFactory('routes', RoutesFactory);
};

const wireUpApp = () => {
  setUpDiContainer();

  const { logException } = LoggerFactory(process.env.NODE_ENV);
  registerDependency('logException', logException);

  registerRoutes();

  return diContainer;
};

module.exports = { wireUpApp };
