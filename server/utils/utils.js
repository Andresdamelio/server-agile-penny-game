const { rooms } = require('../server');

const searchRoomsPlayer = (id) => {
  return rooms.filter(room => {
    return room.getPlayer(id)
  })
}

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

const getNotify = (title, message) => {
  return {
    notify: {
      show: true,
      title: title,
      message: message
    }
  }
}

module.exports = {
  searchRoomsPlayer,
  getRandomInt,
  getNotify
}