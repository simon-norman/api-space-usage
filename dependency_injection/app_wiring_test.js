
const { wireUpApp } = require('./app_wiring');

describe('app_wiring', () => {
  describe('successfully register and return dependencies', () => {
    it('should wire up app', () => {
      wireUpApp();
    });
  });
});

