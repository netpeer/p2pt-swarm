export default class P2PTPeer {
  #connected = false
  #messageQue = []
  #chunksQue = {}
  #channel
  id;
  #peerId;
  #channelName
  #chunkSize = 16 * 1024 // 16384
  #queRunning = false
  #MAX_BUFFERED_AMOUNT = 16 * 1024 * 1024
  initiator = false
  state;
  #connection

  get channelName() {
    return this.#channelName
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
    return this.#init(options)
  }

  async #init(options) {
    if (!globalThis.pako) {
      const importee = await import('pako')
      globalThis.pako = importee.default
    }
    return this
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

  request(data) {
    return this.send(data)
  }

  #trySend({ size, id, chunks }) {
    let offset = 0

    for (const chunk of chunks) {
      const start = offset
      const end = offset + chunk.length

      const message = new TextEncoder().encode(JSON.stringify({ size, id, chunk, start, end }));
      this.#messageQue.push(message)
    }

    if (!this.queRunning) return this.#runQue()
  }

  async #runQue() {
    this.#queRunning = true
    if (this.#messageQue.length > 0 && this.#channel?.bufferedAmount + this.#messageQue[0]?.length < this.#MAX_BUFFERED_AMOUNT) {
      const message = this.#messageQue.shift()
      await this.#connection.send(message);
      if (this.#messageQue.length > 0) return this.#runQue()
    } else {
      return setTimeout(() => this.#runQue(), 50)
    }
  }

  splitMessage(message) {
    const chunks = []
    message = pako.deflate(message)
    const size = message.byteLength || message.length
    let offset = 0
    return new Promise((resolve, reject) => {
      const splitMessage = () => {
        const chunk = message.slice(offset, offset + this.#chunkSize > size ? size : offset + this.#chunkSize)
        offset += this.#chunkSize
        chunks.push(chunk)
        if (offset < size) return splitMessage()
        else resolve({chunks, size})
      }

      splitMessage()
    })
  }

  get peerId() {
    return this.#peerId
  }
}