
const { expect } = require('chai');

const DiContainerInclStampsStampFactory = require('./di_container_incl_stamps');
const DiContainerStampFactory = require('./di_container');
const stampit = require('stampit');
const DependencyNotFoundError = require('../helpers/error_handling/errors/DependencyNotFoundError.js');
const DependencyAlreadyRegisteredError = require('../helpers/error_handling/errors/DependencyAlreadyRegisteredError');

describe('di_container', () => {
  let dependencyOneData;
  let dependencyTwoData;
  let diContainerInclStamps;

  const setUpDiContainerInclStamps = () => {
    const DiContainerStamp
      = DiContainerStampFactory(DependencyNotFoundError, DependencyAlreadyRegisteredError);
    const DiContainerInclStampsStamp = DiContainerInclStampsStampFactory(DiContainerStamp);
    diContainerInclStamps = DiContainerInclStampsStamp();
  };

  const mockStampOneFactory = () => {
    const mockStampOne = stampit({
      init({ dependencyOne }) {
        this.dependencyOne = dependencyOne;
      },
    });
    return mockStampOne;
  };

  const mockStampTwoFactory = (mockStampOne) => {
    let mockStampTwo = stampit({
      init({ dependencyTwo }) {
        this.dependencyTwo = dependencyTwo;
      },
    });

    mockStampTwo = mockStampTwo.compose(mockStampOne);
    return mockStampTwo;
  };

  beforeEach(() => {
    dependencyOneData = 'dependency one';
    dependencyTwoData = 'dependency two';

    setUpDiContainerInclStamps();
  });

  describe('successfully register and return dependencies', () => {
    it('should generate dependency from stamp, injecting it with its required dependencies, then return it', () => {
      diContainerInclStamps.registerDependency('dependencyOne', dependencyOneData);
      diContainerInclStamps.registerDependency('dependencyTwo', dependencyTwoData);

      const mockStampOne = mockStampOneFactory();
      const mockStampTwo = mockStampTwoFactory(mockStampOne);
      const mockTwo = diContainerInclStamps.registerDependencyFromStamp('mockTwo', mockStampTwo);

      expect(mockTwo.dependencyOne).equals(dependencyOneData);
      expect(mockTwo.dependencyTwo).equals(dependencyTwoData);
    });

    it('should generate dependency from stamp factory (IE generate both the stamp and the stamp instance, registering both)', () => {
      diContainerInclStamps.registerDependency('dependencyOne', dependencyOneData);
      diContainerInclStamps.registerDependency('dependencyTwo', dependencyTwoData);
      diContainerInclStamps.registerDependencyFromFactory('mockStampOne', mockStampOneFactory);

      const mockTwo = diContainerInclStamps.registerDependencyFromStampFactory('mockTwo', 'mockStampTwo', mockStampTwoFactory);

      expect(mockTwo.dependencyOne).equals(dependencyOneData);
      expect(mockTwo.dependencyTwo).equals(dependencyTwoData);
    });
  });
});

