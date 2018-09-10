

module.exports = (SpaceUsage) => {
  const spaceUsageController = {};
  spaceUsageController.saveSpaceUsage = async (request, response, next) => {
    try {
      const savedSpaceUsage = await SpaceUsage.findOneAndUpdate(
        { _id: request.body._id },
        request.body,
        {
          upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true,
        },
      );

      response.status(200).json(savedSpaceUsage);
    } catch (err) {
      const error = new Error(err.message);
      next(error);
    }
  };

  return spaceUsageController;
};
