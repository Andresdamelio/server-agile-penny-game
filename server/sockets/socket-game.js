const { io, rooms } = require('../server');
const { Room } = require('../classes/room');
const { Player } = require('../classes/player');
const { searchRoomsPlayer } = require('../utils/utils');


io.on('connection', (client) => {

  console.log("New client on")
  client.on('disconnecting', () => {
    let roomsPlayer = searchRoomsPlayer(client.id);
    if (roomsPlayer.length) {
      let player = roomsPlayer[0] ? roomsPlayer[0].getPlayer(client.id) : null;
      if (player)
        client.to(roomsPlayer[0].id).emit('SHOW_NOTIFY', {
          notify: { show: true, title: "Aviso", message: `${player.name} ha abandonado la sala` },
        })
    }
  });

  //Listen client events
  client.on('newRoom', (size, callback) => {
    try {
      let room = new Room(size);
      rooms.push(room)
      callback({ ok: true, room })
    } catch (err) {
      callback({ ok: false })
    }
  });

  client.on('joinRoom', ({ name, roomId }, callback) => {
    let index = rooms.findIndex(room => room.id === roomId && !room.isFull())
    if (index > -1) {
      client.join(roomId)
      let player = new Player(client.id, name);
      rooms[index].addPlayer(player);

      client.to(roomId).emit('NEW_PLAYER', {
        room: rooms[index],
      })

      client.to(roomId).emit('SHOW_NOTIFY', {
        notify: { show: true, title: "Nuevo jugador", message: `${player.name} se ha unido a la sala` },
      })

      if (rooms[index].isFull()) {

        client.to(roomId).emit('TAKE_TURN', {
          playerId: rooms[index].players[0].id,
          quantCoins: rooms[index].getActualRound().sizeLot
        });
      }

      callback({
        ok: true,
        room: rooms[index]
      })

    } else {
      callback({ ok: false, error: 'La sala no esta disponible o está llena.' })
    }
  });

  client.on('initRound', (roomId) => {
    let room = rooms.find(room => room.id === roomId)
    client.to(roomId).emit('INIT_ROUND', room)
  })

  client.on('startCounter', (roomId) => {
    client.emit("START_COUNTER");
    client.to(roomId).emit('START_COUNTER');
  })

  client.on('saveResult', ({roomId, time, type}) => {
    let room = rooms.find(room => room.id === roomId);
    let round = room.rounds[room.actualRound];
    if(type === 'init')
      round.addResultInit(room.getPlayer(client.id), time);
    else
      round.addResultEnd(room.getPlayer(client.id), time);

    if (room.isLastPlayer(client.id) && room.isEndCurrentRound(client.id)) {
      room.nextRound()
      client.emit('STOP_COUNTER')
      client.to(roomId).emit('STOP_COUNTER')
      client.emit('INIT_ROUND', room)
      client.to(roomId).emit('INIT_ROUND', room)
    }
  })

  client.on('moveCoin', ({ coordinateX, coordinateY, roomId, type }) => {
    let room = rooms.find(room => room.id == roomId)
    let player = room ? room.getPlayer(client.id) : null;
    if (type === "select") {
      player.addSelectedCoin({ row: coordinateX, col: coordinateY });
    } else {
      player.removeSelectedCoin({ row: coordinateX, col: coordinateY });
    }

    client.emit("UPDATE_PLAYER", player);

    client.to(roomId).emit("MOVE_COIN", {
      player,
      coin: { row: coordinateX, col: coordinateY, playerId: player.id }
    });
  });

  client.on('moveCoins', ({ roomId }) => {
    let room = rooms.find(room => room.id === roomId);
    let player = room.getPlayer(client.id);

    player.setMovedCoins();
    player.cleanSelectedCoins();

    client.emit("UPDATE_PLAYER", player);
    client.to(roomId).emit("UPDATE_PLAYER", player);
  });

  client.on('endGame', ({roomId}) => {
    client.emit('GAME_FINISHED');
    client.to(roomId).emit('GAME_FINISHED');
  })

})

module.exports = {
  rooms
}