const shuffle = require("lodash/shuffle");
const { io, rooms } = require("../server");
const { Room } = require("../classes/room");
const { Player } = require("../classes/player");
const {
  searchRoomsPlayer,
  getRandomInt,
  getNotify,
} = require("../utils/utils");

io.on("connection", (client) => {
  client.on("disconnecting", () => {
    let roomsPlayer = searchRoomsPlayer(client.id);
    if (roomsPlayer.length) {
      let player = roomsPlayer[0] ? roomsPlayer[0].getPlayer(client.id) : null;
      if (player) {
        client
          .to(roomsPlayer[0].id)
          .emit(
            "SHOW_NOTIFY",
            getNotify("Aviso", `${player.name} ha abandonado la sala`)
          );
      }
    }
  });

  //Listen client events
  client.on("newRoom", (size, callback) => {
    try {
      let room = new Room(size);
      rooms.push(room);
      callback({ ok: true, room });
    } catch (err) {
      callback({ ok: false });
    }
  });

  client.on("joinRoom", ({ name, roomId }, callback) => {
    let index = rooms.findIndex((room) => room.id === roomId && !room.isFull());
    if (index > -1) {
      client.join(roomId);
      let player = new Player(client.id, name);
      rooms[index].addPlayer(player);

      client.to(roomId).emit("NEW_PLAYER", {
        room: rooms[index],
      });

      client
        .to(roomId)
        .emit(
          "SHOW_NOTIFY",
          getNotify("Nuevo jugador", `${player.name} se ha unido a la sala`)
        );

      if (rooms[index].isFull()) {
        client.to(roomId).emit("TAKE_TURN", {
          playerId: rooms[index].players[0].id,
          quantCoins: rooms[index].getActualRound().sizeLot,
        });
      }

      callback({ ok: true, room: rooms[index] });
    } else {
      callback({
        ok: false,
        error: "La sala no esta disponible o está llena.",
      });
    }
  });

  client.on("initRound", (roomId) => {
    let room = rooms.find((room) => room.id === roomId);
    client.to(roomId).emit("INIT_ROUND", room);
  });

  client.on("startCounter", (roomId) => {
    client.emit("START_COUNTER");
    client.to(roomId).emit("START_COUNTER");
  });

  client.on("saveResult", ({ roomId, time, type, id }) => {
    let room = rooms.find((room) => room.id === roomId);
    let round = room.rounds[room.actualRound];
    if (type === "init") round.addResultInit(room.getPlayer(id), time);
    else round.addResultEnd(room.getPlayer(id), time);

    if (room.isLastPlayer(id) && room.isEndCurrentRound(id)) {
      room.nextRound();
      client.emit("STOP_COUNTER");
      client.to(roomId).emit("STOP_COUNTER");
      client.emit("INIT_ROUND", room);
      client.to(roomId).emit("INIT_ROUND", room);
    }
  });

  client.on("moveCoin", ({ coordinateX, coordinateY, roomId, type }) => {
    let room = rooms.find((room) => room.id == roomId);
    let player = room ? room.getPlayer(client.id) : null;
    if (type === "select") {
      player.addSelectedCoin({ row: coordinateX, col: coordinateY });
    } else {
      player.removeSelectedCoin({ row: coordinateX, col: coordinateY });
    }

    client.emit("UPDATE_PLAYER", player);

    client.to(roomId).emit("MOVE_COIN", {
      player,
      coin: { row: coordinateX, col: coordinateY, playerId: player.id },
    });
  });

  client.on("moveCoins", ({ roomId }) => {
    let room = rooms.find((room) => room.id === roomId);
    let player = room.getPlayer(client.id);

    const moveCoins = (player) => {
      let playerSelectedCoins = player.selectedCoins;
      player.setMovedCoins();
      player.cleanSelectedCoins();

      client.emit("UPDATE_PLAYER", player);
      client.to(roomId).emit("UPDATE_PLAYER", player);

      let nextPlayer = room.getPlayerNext(player.id);
      if (nextPlayer.isAuto) {
        client.emit("MOVING_AUTO_PLAYER", {
          player: nextPlayer.id,
          status: false,
        });

        nextPlayer.coinsCanMove = shuffle([
          ...nextPlayer.coinsCanMove,
          ...playerSelectedCoins,
        ]);

        const autoPlay = (client, nextPlayer) => {
          let sizeLot = room.rounds[room.actualRound].sizeLot;

          let moveAutoCoins = (sizeLot) => {
            let size = sizeLot;

            if (size <= 0) {
              size = room.rounds[room.actualRound].sizeLot;
              if (nextPlayer.selectedCoins.length % sizeLot) {
                console.log("CANTIDAD INVALIDA");
              }
              moveCoins(nextPlayer);
              client.emit("MOVING_AUTO_PLAYER", {
                player: nextPlayer.id,
                status: true,
              });
              if (nextPlayer.coinsCanMove.length <= 0) {
                return;
              }
            }

            let coinSelected = nextPlayer.coinsCanMove.pop();
            nextPlayer.addSelectedCoin(coinSelected);
            size--;
            console.log("size", size);
            setTimeout(() => {
              client.to(roomId).emit("MOVE_COIN", {
                player: nextPlayer,
                coin: { ...coinSelected, playerId: nextPlayer.id },
              });
              client.emit("MOVE_COIN", {
                player: nextPlayer,
                coin: { ...coinSelected, playerId: nextPlayer.id },
              });

              if (nextPlayer.coinsCanMove.length >= 0) {
                moveAutoCoins(size);
              }
            }, getRandomInt(200, 700));
          };
          if (nextPlayer.selectedCoins <= 0) {
            moveAutoCoins(sizeLot);
          }
        };
        autoPlay(client, nextPlayer);
      }
    };

    moveCoins(player);
  });

  client.on("endGame", ({ roomId }) => {
    client.emit("GAME_FINISHED");
    client.to(roomId).emit("GAME_FINISHED");
  });

  client.on("createAutoPlayers", ({ roomId }) => {
    let room = rooms.find((room) => room.id === roomId);
    let newPlayers = room.createAutoPlayers();

    client.emit("NEW_PLAYER", {
      room,
    });

    client.to(roomId).emit("NEW_PLAYER", {
      room,
    });

    for (player of newPlayers) {
      client.emit(
        "SHOW_NOTIFY",
        getNotify("Nuevo jugador", `${player.name} se ha unido a la sala`)
      );

      client
        .to(roomId)
        .emit(
          "SHOW_NOTIFY",
          getNotify("Nuevo jugador", `${player.name} se ha unido a la sala`)
        );
    }
  });
});

module.exports = {
  rooms,
};
