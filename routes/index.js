
const router = require('express').Router();

module.exports = (spaceRoutes) => {
  router.use('/spaces', spaceRoutes);

  return router;
};

