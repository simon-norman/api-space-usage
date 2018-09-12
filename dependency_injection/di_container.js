
const parseFunctionArgs = require('parse-fn-args');
const stampit = require('stampit');

module.exports = (DependencyNotFoundError, DependencyAlreadyRegisteredError) => stampit({
  props: {
    DependencyNotFoundError,
    DependencyAlreadyRegisteredError,
  },

  init() {
    this.dependencies = {};
  },

  methods: {
    registerDependency(name, dependency) {
      if (this.dependencies[name]) {
        throw new DependencyAlreadyRegisteredError(`A dependency with the name ${name} has already been registered`);
      }
      this.dependencies[name] = dependency;
    },

    registerDependencyFromFactory(name, factory) {
      try {
        const dependenciesOfFactory = this.getDependenciesOfFactory(factory);
        const dependencyFromFactory = factory(...dependenciesOfFactory);

        this.registerDependency(name, dependencyFromFactory);
        return dependencyFromFactory;
      } catch (error) {
        throw this.getRegisterDependencyFromConstructorError(error, name);
      }
    },

    getRegisterDependencyFromConstructorError(error, dependencyName) {
      if (error instanceof DependencyNotFoundError) {
        return new Error(`Dependency ${dependencyName} cannot be registered as one or more of its dependencies have not been registered`);
      }
      return error;
    },

    getDependenciesOfFactory(factory) {
      const dependencyNamesOfFactory = parseFunctionArgs(factory);
      return this.getDependencies(dependencyNamesOfFactory);
    },

    getDependencies(dependencyNames) {
      return dependencyNames.map(dependencyName => this.getDependency(dependencyName));
    },

    getDependency(name) {
      if (this.dependencies[name]) {
        return this.dependencies[name];
      }
      throw new DependencyNotFoundError('The requested dependency could not be found');
    },
  },
});

