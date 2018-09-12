
const parseFunctionArgs = require('parse-fn-args');
const stampit = require('stampit');

module.exports = (DiContainerStamp) => {
  const DiContainerInclStampsStamp = stampit({
    methods: {
      registerDependencyFromStampFactory(name, stampName, stampFactory) {
        const stamp = this.registerDependencyFromFactory(stampName, stampFactory);
        const dependencyFromStamp = this.registerDependencyFromStamp(name, stamp);

        return dependencyFromStamp;
      },

      registerDependencyFromStamp(name, stamp) {
        const dependenciesOfStamp = this.getDependenciesOfStamp(stamp);
        const dependencyFromStamp = stamp(dependenciesOfStamp);

        this.registerDependency(name, dependencyFromStamp);
        return dependencyFromStamp;
      },

      getDependenciesOfStamp(stamp) {
        const stampDependencies = {};
        if (stamp.compose.initializers) {
          for (const initializer of stamp.compose.initializers) {
            const destructuredParams = parseFunctionArgs(initializer)[0];
            const stampDependencyNamesForThisInitializer =
              this.getKeysFromDestructuredParams(destructuredParams);

            stampDependencyNamesForThisInitializer.forEach((dependencyName) => {
              const stampDependency = this.getDependency(dependencyName);
              stampDependencies[dependencyName] = stampDependency;
            });
          }
        }


        return stampDependencies;
      },

      getKeysFromDestructuredParams(destructuredParams) {
        const destructuredParamsWithoutLeftBracket = destructuredParams.replace('{', '');
        const destructuredParamsWithoutBrackets = destructuredParamsWithoutLeftBracket.replace('}', '');
        const destructuredParamsWithoutSpaces = destructuredParamsWithoutBrackets.replace(' ', '');
        return destructuredParamsWithoutSpaces.split(',');
      },
    },
  });

  return DiContainerInclStampsStamp.compose(DiContainerStamp);
};

