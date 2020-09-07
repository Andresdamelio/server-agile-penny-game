let { rooms } = require('../server');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/rooms', (req, res) => {
  return res.json({
      ok: true,
      rooms
  })
})


app.get('/room/:id', (req, res) => {
  let roomId = req.params.id;
  let room = rooms.find(room => room.id === roomId)
  if(!room){
      return res.status(404).json({
          ok: false,
          message: "Sala no encontrada."
      })
  }
  return res.json({
      ok: true,
      room
  })
})

app.get('/results/:roomId', (req, res) => {
  let roomId = req.params.roomId;
  let room = rooms.find(room => room.id === roomId)
  if(!room){
      return res.status(404).json({
          ok: false,
          message: "Sala no encontrada."
      })
  }
  return res.json({
      ok: true,
      resume: {
        tableResults: room.generateResumeRounds(),
        termVsCost: room.generateDeliveryVsAverage()
      }
  })
})

module.exports = app;