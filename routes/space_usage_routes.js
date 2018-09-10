const express = require('express');

module.exports = (spaceUsageController) => {
  const router = express.Router();

  router.post('/', spaceUsageController.saveSpaceUsage);

  return router;
};
