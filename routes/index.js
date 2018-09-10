
const router = require('express').Router();

module.exports = (spaceRoutes, spaceUsageRoutes) => {
  router.use('/spaces', spaceRoutes);

  router.use('/spaceUsage', spaceUsageRoutes);

  return router;
};

