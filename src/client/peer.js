export default class P2PTPeer {
  id;
  #peerId;
  #channelName
  initiator = false
  state;
  #connection

  get channelName() {
    return this.#channelName
  }

  get connected() {
    return this.#connection.connected
  }

  constructor(peer, p2pt, options = {}) {
    this.#connection = peer
    this.p2pt = p2pt
    this.id = options.id
    this.to = options.to
    this.bw = {
      up: 0,
      down: 0
    }

    this.#channelName = peer.channelName 

    this.#peerId = this.p2pt.peerId
    this.options = options
  }

  _handleMessage(message) {
    message = JSON.parse(new TextDecoder().decode(message.slice(1)))
    // allow sharding (multiple peers share data)
    pubsub.publish('peernet:shard', message)
    const { id, from } = message

    // console.log(new TextDecoder().decode(new Uint8Array(Object.values(JSON.parse(message.msg)))));
    const data = new Uint8Array(Object.values(JSON.parse(message.msg)))
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