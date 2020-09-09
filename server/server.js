const socketIO = require("socket.io");
const express = require("express");
const http = require("http");
let rooms = [];

const path = require("path");

const app = express();
let server = http.createServer(app);

const publicPath = path.resolve(__dirname, "../public");
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

module.exports = {
  io: socketIO(server),
  rooms,
};

app.use(require("./routes/routes"));

require("./sockets/socket-game");

server.listen(port, (err) => {
  if (err) throw new Error(err);

  console.log(`Servidor corriendo en el puerto ${port}`);
});
