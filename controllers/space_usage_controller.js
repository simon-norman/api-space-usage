

module.exports = (SpaceUsage) => {
  const spaceUsageController = {};
  spaceUsageController.saveSpaceUsage = async (request, response, next) => {
    try {
      let savedSpaceUsage = await SpaceUsage.findByIdAndUpdate(
        request.body._id,
        request.body,
        {
          runValidators: true,
        },
      );

      if (!savedSpaceUsage) {
        savedSpaceUsage = new SpaceUsage(request.body);
        await savedSpaceUsage.save();
      }

      response.status(200).json(savedSpaceUsage);
    } catch (err) {
      const error = new Error(err.message);
      next(error);
    }
  };

  return spaceUsageController;
};
