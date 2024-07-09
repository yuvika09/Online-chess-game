const socket = io();

socket.on("churan", function () {
  console.log("churan recieved");
});
