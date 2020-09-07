class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.movedCoins = [];
    this.selectedCoins = [];
  }
  setMovedCoins() {
    this.movedCoins = [...this.movedCoins, ...this.selectedCoins];
  }
  cleanSelectedCoins() {
    this.selectedCoins = [];
  }
  addSelectedCoin(coin) {
    this.selectedCoins.push(coin);
  }
  removeSelectedCoin(coin) {
    let coinIndex = this.selectedCoins.findIndex(
      (mcoin) => mcoin.row === coin.row && mcoin.col === coin.col
    );
    this.selectedCoins.splice(coinIndex, 1);
  }
}

module.exports = {
  Player,
};
