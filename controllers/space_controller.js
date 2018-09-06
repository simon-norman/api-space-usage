

module.exports = (Space) => {
  const spaceController = {};
  spaceController.getSpaces = async (request, response, next) => {
    try {
      const spaces = await Space.find({});

      if (spaces.length) {
        response.status(200).json(spaces);
      } else {
        const error = new Error('Spaces not found');
        error.status = 404;
        next(error);
      }
    } catch (err) {
      const error = new Error(err.message);
      next(error);
    }
  };

  return spaceController;
};
