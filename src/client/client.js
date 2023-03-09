import P2PT from "@leofcoin/p2pt";
import P2PTPeer from "./peer.js";
import LittlePubSub from "@vandeurenglenn/little-pubsub/index.js";

if (!globalThis.pubsub) globalThis.pubsub = new LittlePubSub()

export default class P2PTClient extends P2PT {
  #discovered = {

  }

  bw = {
    up: 0,
    down: 0
  }

  get discovered() {
    return this.#discovered || {}
  }

  constructor(peerId, networkVersion = 'leofcoin:peach', stars = ['wss://peach.leofcoin.org']) {
    super(stars, networkVersion, peerId)

    this.stars = stars
    this.networkVersion = networkVersion
    this.peerId = peerId

    this.on('trackerconnect', async (tracker, stats) => {
      const peers = tracker.peers
      let promises = Object.entries(peers).map(async ([id, peer]) => {
        this.#discovered[id] = await new P2PTPeer(peer, this)
      })

      promises = await Promise.allSettled(promises)
    })

    this.on('peerconnect', async (peer) => {
      this.#discovered[peer.id] = await new P2PTPeer(peer, this)
      pubsub.publish('peer:discovered', this.#discovered[peer.id])
    })

    this.on('data', async (peer, data) => {
      const hasPeer = this.#discovered[peer.id]
      if (!hasPeer) this.#discovered[peer.id] = await new P2PTPeer(peer, this)
      
      this.#discovered[peer.id]?._handleMessage(new Uint8Array(Object.values(data)))
      this.bw.down += data.length || data.byteLength
    })
    console.log('Peer started as: ' + this._peerId)
    this.start()
  }
  
}
