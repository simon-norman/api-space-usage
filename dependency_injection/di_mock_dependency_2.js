const stampit = require('stampit');

module.exports = (diMockDependency1) => {
  const diMockDependency2 = stampit({
    props: {
      diMockDependency1,
      propertyOfDiMockDependency2: 'propertyOfDiMockDependency2',
    },
  });
  return diMockDependency2;
};

