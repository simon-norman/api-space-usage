const express = require('express');

module.exports = (spaceController) => {
  const router = express.Router();

  router.get('/', spaceController.getSpaces);

  return router;
};
