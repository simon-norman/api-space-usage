const mongoose = require('mongoose');

const { Schema } = mongoose;

const SpaceSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  occupancyCapacity: { type: Number, required: true },
});

const Space = mongoose.model('Space', SpaceSchema);

module.exports = Space;
