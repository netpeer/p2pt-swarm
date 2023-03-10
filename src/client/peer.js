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