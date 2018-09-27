
const DependencyNotFoundError = require('../services/error_handling/errors/DependencyNotFoundError');
const DependencyAlreadyRegisteredError = require('../services/error_handling/errors/DependencyAlreadyRegisteredError');
const DiContainerStampFactory = require('./di_container');
const DiContainerInclStampsStampFactory = require('./di_container_incl_stamps');
const Space = require('../models/space');
const SpaceControllerFactory = require('../controllers/space_controller');
const Client = require('../models/client');
const SpaceUsage = require('../models/space_usage');
const GetSpaceUsageControllerFactory = require('../controllers/get_space_usage_controller');
const SaveSpaceUsageControllerFactory = require('../controllers/save_space_usage_controller');

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

  registerRoutes();

  return diContainer;
};

module.exports = { wireUpApp };
