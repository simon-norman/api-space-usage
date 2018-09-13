
const DependencyNotFoundError = require('../services/error_handling/errors/DependencyNotFoundError');
const DependencyAlreadyRegisteredError = require('../services/error_handling/errors/DependencyAlreadyRegisteredError');
const DiContainerStampFactory = require('./di_container');
const DiContainerInclStampsStampFactory = require('./di_container_incl_stamps');
const LoggerFactory = require('../services/error_handling/logger/logger.js');
const Space = require('../models/space');
const SpaceControllerFactory = require('../controllers/space_controller');
const SpaceRoutesFactory = require('../routes/space_routes');
const SpaceUsage = require('../models/space_usage');
const SpaceUsageControllerFactory = require('../controllers/space_usage_controller');
const SpaceUsageRoutesFactory = require('../routes/space_usage_routes');
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

const registerSpaceRoutes = () => {
  registerDependency('Space', Space);
  registerDependencyFromFactory('spaceController', SpaceControllerFactory);
  registerDependencyFromFactory('spaceRoutes', SpaceRoutesFactory);
};

const registerSpaceUsageRoutes = () => {
  registerDependency('SpaceUsage', SpaceUsage);
  registerDependencyFromFactory('spaceUsageController', SpaceUsageControllerFactory);
  registerDependencyFromFactory('spaceUsageRoutes', SpaceUsageRoutesFactory);
};

const registerRoutes = () => {
  registerSpaceRoutes();
  registerSpaceUsageRoutes();

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
