class Round {
  constructor(number, size) {
    this.number = number;
    this.sizeLot = size;
    this.results = [];
  }

  addResultInit(player, initWait) {
    let time = initWait ? initWait.millis / 1000 : 0;
    this.results.push({
      player,
      initWait: time,
      receptionTime: null,
      deliveryTerm: null,
    });
  }

  addResultEnd(player, receptionTime) {
    let time = receptionTime.millis / 1000;
    let resultIndex = this.results.findIndex(
      (res) => res.player.id === player.id
    );
    if (resultIndex > -1) {
      this.results[resultIndex].receptionTime = time;
      this.results[resultIndex].deliveryTerm =
        time - this.results[resultIndex].initWait;
    }
  }
}

module.exports = {
  Round,
};
