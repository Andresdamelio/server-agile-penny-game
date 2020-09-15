const { v4: uuidv4 } = require("uuid");
const { Round } = require("./round");
const { Player } = require("./player");

class Room {
  constructor(size = 2) {
    this.id = uuidv4();
    this.players = [];
    this.size = size;
    this.rounds = this.createRounds();
    this.actualRound = 0;
    this.createdAt = new Date();
  }

  createRounds() {
    let round1 = new Round(1, 20),
      round2 = new Round(2, 10),
      round3 = new Round(3, 5),
      round4 = new Round(4, 1);
    return [round1, round2, round3, round4];
  }

  addPlayer(player) {
    this.players.push(player);
  }

  getPlayer(id) {
    return this.players.find((player) => player.id === id);
  }

  getPlayerIndex(id) {
    return this.players.findIndex((player) => player.id === id);
  }

  isLastPlayer(id) {
    return (
      this.players.findIndex((player) => player.id === id) >=
      this.players.length - 1
    );
  }

  isEndCurrentRound(id) {
    return this.getPlayer(id).movedCoins.length === 20;
  }

  getPlayerNext(id) {
    return this.isLastPlayer(id)
      ? this.players[0]
      : this.players[this.getPlayerIndex(id) + 1];
  }

  restartMovedCoins() {
    this.players.forEach((player) => {
      player.movedCoins = [];
    });
  }

  restartSelectedCoins() {
    this.players.forEach((player) => {
      player.selectedCoins = [];
    });
  }

  isFull() {
    return this.size == this.players.length;
  }

  nextRound() {
    this.actualRound++;
    this.restartMovedCoins();
    this.restartSelectedCoins();
  }

  getActualRound() {
    return this.actualRound + 1;
  }

  generateResumeRounds() {
    let tableResults = this.rounds.map((round) => {

      return {
        number: round.number,
        sizeLot: round.sizeLot,
        results: round.results.slice().reverse(),
        chartLabels: round.results
          .slice().reverse()
          .map((res) => res.player.name),
        chartData: [
          {
            label: "Espera inicial",
            backgroundColor: "#baece9",
            borderColor: "#00A99D",
            borderWidth: 1,
            data: round.results
              .slice().reverse()
              .map((res) => res.initWait),
          },
          {
            label: "Plazo de entrega",
            backgroundColor: "#00A99D",
            data: round.results
              .slice().reverse()
              .map((res) => res.deliveryTerm),
          },
        ],
      };
    });
    return tableResults;
  }

  generateDeliveryVsAverage() {
    let individualAverage = this.rounds
      .map((round) => {
        let playersDelay = round.results.map((res) => res.deliveryTerm);
        return playersDelay.reduce((a, b) => a + b) / round.results.length;
      })
      .reverse();

    let deliveryTerms = this.rounds
      .map((round) => {
        return round.results[round.results.length - 1].receptionTime;
      })
      .reverse();

    let termVsCost = {
      results: this.players.map((player) => {
        return {
          player,
          values: this.rounds
            .map((round) => {
              return round.results.find((res) => res.player.id === player.id)
                .deliveryTerm;
            })
            .reverse(),
        };
      }),
      deliveryTerms,
      individualAverage,
      chartLabels: ["Lotes de 1", "Lotes de 5", "Lotes de 10", "Lotes de 20"],
      chartData: [
        {
          label: "Promedio individual",
          borderColor: "#333",
          lineTension: 0.2,
          data: individualAverage,
        },
        {
          label: "Plazo de entrega",
          borderColor: "#00A99D",
          lineTension: 0.2,
          data: deliveryTerms,
        },
      ],
    };
    return termVsCost;
  }

  createAutoPlayers() {
    let playersQuantity = this.players.length;
    if (this.size > playersQuantity) {
      let playersMissing = this.size - playersQuantity;
      for (let i = 1; i <= playersMissing; i++) {
        this.players.push(
          new Player(playersQuantity + i, `Bot ${playersQuantity + i}`, true)
        );
      }
    }
    return this.players.slice().splice(playersQuantity - 1);
  }
}

module.exports = {
  Room,
};
