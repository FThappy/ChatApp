const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name:String,
  quantity : Number,
});

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
