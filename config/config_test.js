
const { expect } = require('chai');

const { getConfigForEnvironment } = require('./config.js');


describe('config', () => {
  describe('get config for the specified environment', () => {
    it('should return config for the specified environment', async () => {
      const configForProduction = getConfigForEnvironment('production');
      expect(configForProduction).to.exist;
    });

    it('should throw an error when environment specified is not found in config', async () => {
      const wrappedGetConfigForEnvironment = () => {
        getConfigForEnvironment('fakeenvironment');
      };
      expect(wrappedGetConfigForEnvironment).to.throw(Error);
    });
  });
});

