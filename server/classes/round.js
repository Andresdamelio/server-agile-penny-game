class Round {
  constructor(number, size) {
    this.number = number;
    this.sizeLot = size;
    this.results = [];
  }
  addResultInit(player, initWait) {
    let time = initWait.millis / 1000;
    this.results.push({
      player,
      initWait: time,
      delay: null,
      deliveryTerm: null
    })
  }
  addResultEnd(player, deliveryTerm) {
    let time = deliveryTerm.millis / 1000;
    let resultIndex = this.results.findIndex(res => res.player.id === player.id);
    if(resultIndex > -1) {
      this.results[resultIndex].deliveryTerm = time;
      this.results[resultIndex].delay = time - this.results[resultIndex].initWait;
    }
  }
}

module.exports = {
  Round
}