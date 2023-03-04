
import {Server} from 'bittorrent-tracker'
export default class {
  constructor(port) {

var server = new Server({
  udp: false, // enable udp server? [default=true]
  http: true, // enable http server? [default=true]
  ws: true, // enable websocket server? [default=true]
  stats: false // enable web-based statistics? [default=true]
})

console.log(server);

server.on('error', function (err) {
  // fatal server error!
  console.log(err.message)
})

server.on('warning', function (err) {
  // client sent bad data. probably not a problem, just a buggy client.
  console.log(err.message)
})

server.on('listening', function () {
  // fired when all requested servers are listening
  console.log('listening on http port:' + server.http.address().port)
})

// listen for individual tracker messages from peers:

server.on('start', function (addr) {
  console.log('got start message from ' + addr)
})

server.on('complete', function (addr) {})
server.on('update', function (addr) {
  console.log('update from ' + addr)
})
server.on('stop', function (addr) {})

// start tracker server listening! Use 0 to listen on a random free port.
server.listen(port || '5001', '0.0.0.0')

  }
}