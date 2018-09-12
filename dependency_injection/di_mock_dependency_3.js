
const stampit = require('stampit');

module.exports = (diMockDependency1, diMockDependency2) => {
  const diMockDependency3 = stampit({
    props: {
      diMockDependency1,
    },
  });
  return diMockDependency3.compose(diMockDependency2);
};

