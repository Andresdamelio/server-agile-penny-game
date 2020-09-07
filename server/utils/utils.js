const { rooms } = require('../server');

const searchRoomsPlayer = (id) => {
  return rooms.filter(room => {
    return room.getPlayer(id)
  })
}

module.exports = {
  searchRoomsPlayer
}