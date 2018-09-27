
const { expect } = require('chai');

const DiContainerStampFactory = require('./di_container.js');
const { diMockDependency1 } = require('./di_mock_dependency_1.js');
const diMockDependency2 = require('./di_mock_dependency_2.js');
const diMockDependency3 = require('./di_mock_dependency_3.js');
const DependencyNotFoundError = require('../helpers/error_handling/errors/DependencyNotFoundError.js');
const DependencyAlreadyRegisteredError = require('../helpers/error_handling/errors/DependencyAlreadyRegisteredError');

describe('di_container', () => {
  let DiContainerStamp;
  let diContainer;

  before(() => {
    DiContainerStamp = DiContainerStampFactory(
      DependencyNotFoundError,
      DependencyAlreadyRegisteredError,
    );
  });

  beforeEach(() => {
    diContainer = DiContainerStamp();
  });

  describe('successfully register and return dependencies', () => {
    it('should register a dependency and return it when requested', async () => {
      diContainer.registerDependency('diMockDependency1', diMockDependency1);
      const registeredDiMockDependency1 = diContainer.getDependency('diMockDependency1');
      expect(registeredDiMockDependency1).to.equal(diMockDependency1);
    });

    it('should generate dependency from factory, injecting it with its required dependencies, then register and return it', async () => {
      diContainer.registerDependency('diMockDependency1', diMockDependency1);
      diContainer.registerDependencyFromFactory('diMockDependency2', diMockDependency2);
      const registeredDiMockDependency3 = diContainer.registerDependencyFromFactory('diMockDependency3', diMockDependency3);

      expect(registeredDiMockDependency3.compose.properties.diMockDependency1)
        .to.equal(diMockDependency1);
      expect(registeredDiMockDependency3.compose.properties.propertyOfDiMockDependency2)
        .to.equal('propertyOfDiMockDependency2');
    });
  });

  describe('throw errors when registering / getting dependencies fails', () => {
    it('should throw an error when dependency has already been registered', async () => {
      const wrappedRegisterDependency = () => {
        diContainer.registerDependency('diMockDependency1', diMockDependency1);
      };
      wrappedRegisterDependency();
      expect(wrappedRegisterDependency).to.throw(DependencyAlreadyRegisteredError);
    });

    it('should throw an error, during register dependency from factory, when dependency has already been registered', async () => {
      diContainer.registerDependency('diMockDependency1', diMockDependency1);

      const wrappedRegisterDependencyFromFactory = () => {
        diContainer.registerDependencyFromFactory('diMockDependency2', diMockDependency2);
      };
      wrappedRegisterDependencyFromFactory();
      expect(wrappedRegisterDependencyFromFactory).to.throw(DependencyAlreadyRegisteredError);
    });

    it('should throw an error when dependency cannot be found', async () => {
      const wrappedGetDependency = () => {
        diContainer.getDependency('unregistereddependency');
      };
      expect(wrappedGetDependency).to.throw(DependencyNotFoundError);
    });

    it('should throw an error when trying to register a dependency whose dependencies have not yet been registered', async () => {
      const wrappedRegisterDependency = () => {
        diContainer.registerDependencyFromFactory('diMockDependency3', diMockDependency3);
      };
      expect(wrappedRegisterDependency).to.throw('Dependency diMockDependency3 cannot be registered as one or more of its dependencies have not been registered');
    });
  });
});

