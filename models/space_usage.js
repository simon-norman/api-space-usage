const mongoose = require('mongoose');

const { Schema } = mongoose;

const SpaceUsageSchema = new Schema({
  spaceId: { type: String, required: true },
  usagePeriodStartTime: { type: Date, required: true },
  usagePeriodEndTime: { type: Date, required: true },
  numberOfPeopleRecorded: { type: Number, required: true },
});

const SpaceUsage = mongoose.model('Space_usage', SpaceUsageSchema);

module.exports = SpaceUsage;
