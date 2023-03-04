import P2PT from "@leofcoin/p2pt";
import P2PTPeer from "./peer.js";
import LittlePubSub from "@vandeurenglenn/little-pubsub/index.js";
if (!globalThis.pubsub) globalThis.pubsub = new LittlePubSub()
export default class P2PTClient extends P2PT {
  #connections = {

  }

  bw = {
    up: 0,
    down: 0
  }

  static trackersAnnounceURLs = [
    // "wss://tracker.openw/ebtorrent.com",
    'wss://tracker.leofcoin.org'
    // "wss://tracker.btorrent.xyz"
  ]
  static JSON_MESSAGE_IDENTIFIER = '^'

  constructor(options = {}) {
    
    options.networkVersion = options.networkVersion || 'leofcoin:peach'
    super(P2PTClient.trackersAnnounceURLs, options.networkVersion)
    this.networkVersion = options.networkVersion
    this.peerId = options.peerId

// If a tracker connection was successful
this.on('trackerconnect', async (tracker, stats) => {
  // console.log({tracker});
  const peers = tracker.peers
  // console.log(peers);
  for (const [id, peer] of Object.entries(peers)) {
    this.#connections[id] = await new P2PTPeer(peer, this)
    // promises.push(() => peer.send('request'))
    // this.peers.includes(peerId)
  }
})

// If a new peer, send message
this.on('peerconnect', async (peer) => {
  console.log(peer.id);
  console.log('id');
  this.#connections[peer.id] = await new P2PTPeer(peer, this)
  // console.log(peer);
  console.log(peer.id);
  // console.log(peer.send(new TextEncoder().encode(JSON.stringify({data: {type: 'requestId', from: this.peerId}}))));
  // await this.#connections[peer.id].send(new TextEncoder().encode(JSON.stringify({type: 'requestId', from: this.peerId})))
  const id = await this.#connections[peer.id].request(new TextEncoder().encode(JSON.stringify({type: 'requestId', from: this.peerId})))
  console.log({id});
  // this.send(peer, 'Hi').then(([peer, msg]) => {
  //   console.log('Got response : ' + msg)

  // this.send(peer, 'request')
  //   return peer.respond('Bye')
  // }).then(([peer, msg]) => {
  //   console.log('Got response2 : ' + msg)
  // })
})

// If message received from peer
// this.on('msg', async (peer, msg) => {
//   console.log({msg});
//   const hasPeer = this.#connections[peer.id]
//   if (!hasPeer) this.#connections[peer.id] = await new P2PTPeer(peer, this)
// // data.message = new Uint8Array()
//   this.#connections[peer.id]?._handleMessage(new Uint8Array(Object.values(msg)))
//   if (msg.type === 'requestId') peer.respond(this.peerId)
//   console.log(`Got message from ${peer.id} : ${msg}`)
//   if (msg === 'Hi') {
//     peer.respond('Hello !').then(([peer, msg]) => {
//       peer.respond('Bye !')
//     })
//   }
// })

this.on('data', async (peer, data) => {
  // console.log(peer.id);
  // data = data.slice(1)
  // console.log(data);
  const hasPeer = this.#connections[peer.id]
  if (!hasPeer) this.#connections[peer.id] = await new P2PTPeer(peer, this)
// data.message = new Uint8Array()
  this.#connections[peer.id]?._handleMessage(new Uint8Array(Object.values(data)))
  console.log(this.#connections[peer.id]?.bw);
  this.bw.down += data.length || data.byteLength
})
console.log('P2PT started. My peer id : ' + this._peerId)
this.start()
  }
  
}
