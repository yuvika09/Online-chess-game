const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const { title } = require("process");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();

let players = {};
let currPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniqueSocket) {
  console.log("Connected");

  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("spectatorRole");
  }

  uniqueSocket.on("disconnect", function () {
    if (uniqueSocket.id === players.white) {
      delete players.white;
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id === players.white) return;
      if (chess.turn() === "b" && uniqueSocket.id === players.black) return;

      const res = chess.move(move);
      if (res) {
        currPlayer = chess.turn();
        io.emit("move", move);
        //we have sent move from the backend to all the frontends
        io.emit("boardState", chess.fen());
        //chess.fen() will give the current position of the chessboard
      } else {
        console.log("Invalid move: ", move);
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      uniqueSocket.emit("Invalid move: ", move);
    }
  });
});

server.listen(3000, function () {
  console.log("Listening on port 3000");
});
