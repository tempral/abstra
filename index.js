const fs = require('fs');
const http = require('http');
const socketio = require('socket.io');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type' : 'text/html'});
  res.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
}).listen(process.env.PORT);

// S03. HTTPサーバにソケットをひも付ける（WebSocket有効化）
const io = socketio.listen(server);

io.sockets.on('connection', socket => {
  let room = '';
  let name = '';

  // roomへの入室は、「socket.join(room名)」
  socket.on('client_to_server_join', data => {
    room = data.value;
    socket.join(room);
  });

  // S05. client_to_serverイベント・データを受信する
  socket.on('client_to_server', data => {
    // S06. server_to_clientイベント・データを送信する
    io.to(room).emit('server_to_client', {value : data.value});
  });

  // S07. client_to_server_broadcastイベント・データを受信し、送信元以外に送信する
  socket.on('client_to_server_broadcast', data => {
    socket.broadcast.to(room).emit('server_to_client', {value : data.value});
  });

  // S08. client_to_server_personalイベント・データを受信し、送信元のみに送信する
  socket.on('client_to_server_personal', data => {
    const id = socket.id;
    name = data.value;
    const personalMessage = "Hello " + name + ", welcome!" //あなたは、さんとして入室しました。
    io.to(id).emit('server_to_client', {value : personalMessage});
  });

  // S09. dicconnectイベントを受信し、退出メッセージを送信する
  socket.on('disconnect', () => {
    if (name === '') {
      console.log("未入室のまま、どこかへ去っていきました。");
    } else {
      var endMessage = name + " has left the chat room"//さんが退出しました。
      io.to(room).emit('server_to_client', {value : endMessage});
    }
  });
});
