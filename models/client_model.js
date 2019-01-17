const mongoose = require('mongoose');

const { Schema } = mongoose;

const FloorSchema = new Schema({
  name: { type: String, required: true },
  spaceIds: [
    { type: String, required: false },
  ],
});

const SiteSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  floors: [FloorSchema],
});

const ClientSchema = new Schema({
  name: { type: String, required: true, unique: true },
  sites: [SiteSchema],
});

const Client = mongoose.model('Client', ClientSchema);

module.exports = Client;
