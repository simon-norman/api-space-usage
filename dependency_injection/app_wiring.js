
const DependencyNotFoundError = require('../helpers/error_handling/errors/DependencyNotFoundError');
const DependencyAlreadyRegisteredError = require('../helpers/error_handling/errors/DependencyAlreadyRegisteredError');
const DiContainerStampFactory = require('./di_container');
const DiContainerInclStampsStampFactory = require('./di_container_incl_stamps');
const Space = require('../models/space_model');
const SpaceControllerFactory = require('../controllers/space_controller');
const Client = require('../models/client_model');
const SpaceUsage = require('../models/space_usage_model');
const GetSpaceUsageControllerFactory = require('../controllers/get_space_usage_controller');
const SaveSpaceUsageControllerFactory = require('../controllers/save_space_usage_controller');
const ServerFactory = require('../server/server');
const { readFileSync } = require('fs');

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

const registerSpaceUsageRoutes = () => {
  const spaceUsageDataSchema = readFileSync('graphql_schema/space_usage_schema.graphql', 'utf8');
  registerDependency('spaceUsageDataSchema', spaceUsageDataSchema);

  registerDependency('Client', Client);
  registerDependency('SpaceUsage', SpaceUsage);
  registerDependency('Space', Space);
  registerDependencyFromFactory('spaceController', SpaceControllerFactory);
  registerDependencyFromFactory('saveSpaceUsageController', SaveSpaceUsageControllerFactory);
  registerDependencyFromFactory('getSpaceUsageController', GetSpaceUsageControllerFactory);
  registerDependencyFromFactory('server', ServerFactory);
};

const wireUpApp = () => {
  setUpDiContainer();

  registerSpaceUsageRoutes();

  return diContainer;
};

module.exports = { wireUpApp };
