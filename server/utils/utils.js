const { rooms } = require('../server');

const searchRoomsPlayer = (id) => {
  return rooms.filter(room => {
    return room.getPlayer(id)
  })
}

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
  searchRoomsPlayer,
  getRandomInt
}