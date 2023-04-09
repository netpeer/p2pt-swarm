
import P2PT from "@leofcoin/p2pt";

export default class P2PTPeer {
  p2pt: P2PT;
  remotePeerId;
  localPeerId;
  #peerId;
  #channelName
  initiator = false
  state;
  #connection

  get id() {
    return this.#connection.id
  }

  get channelName() {
    return this.#channelName
  }

  get connected() {
    let connected = false
    if (this.p2pt.peers.length === 0) return connected
    if (!this.p2pt.peers[this.id]) return connected
    
    for (const channelId of Object.keys(this.p2pt.peers[this.id])) {
      if (this.p2pt.peers[this.id][channelId].connected) {
        connected = true
        break
      }
    }
    return connected
  }

  // check if channel is connected, if not, consider changing to a connected channel
  get channelConnected() {
    return this.#connection.connected
  }

  get connectionStats() {
    return {
      family: this.#connection.remoteFamily || this.#connection.localFamily || 'ipv4',
      address: this.#connection.remoteAddress || this.#connection.localAddress || '127.0.0.1',
      port: this.#connection.remotePort || this.#connection.localPort || '0000',
    }
  }

  constructor(peer, p2pt, options = {}) {
    this.#connection = peer
    this.p2pt = p2pt
    this.localPeerId = this.p2pt.peerId

    this.bw = {
      up: 0,
      down: 0
    }

    this.#channelName = peer.channelName 

    this.#peerId = this.p2pt.peerId
    this.options = options
  }

  _handleMessage(data, id, from) {
    // console.log(new TextDecoder().decode(new Uint8Array(Object.values(JSON.parse(message.msg)))));
    pubsub.publish('peer:data', { id, data, from, peer: this })
  
    this.bw.down += data.byteLength || data.length
  }

  async send(data, id) {
    this.bw.up += data.byteLength || data.length
    return this.p2pt.send(this.#connection, data, id)
  }

  async request(data) {
    const [peer, msg] = await this.send(data)
    return msg
  }

  get peerId() {
    return this.#peerId
  }
}