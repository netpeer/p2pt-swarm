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
      // const peers = await this.requestMorePeers()
      // let promises = Object.entries(peers).map(async ([id, peer]) => {
			// 	const hasPeer = this.#discovered[peer.id];
			// 	if (!hasPeer) this.#discovered[peer.id] = await new P2PTPeer(peer, this);
      //   pubsub.publish('peer:discovered', this.#discovered[id]);
      // })
      // promises = await Promise.allSettled(promises)
      pubsub.publish('star:connected', tracker)
    })

    this.on('peerconnect', async (peer) => {
      this.#discovered[peer.id] = await new P2PTPeer(peer, this)
      pubsub.publish('peer:discovered', this.#discovered[peer.id])
    })

    this.on('peerclose', async (peer) => {
      pubsub.publish('peer:left', this.#discovered[peer.id])
    })

    this.on('msg', async (peer, data, id, from) => {
      const hasPeer = this.#discovered[peer.id]
      if (!hasPeer) this.#discovered[peer.id] = await new P2PTPeer(peer, this)

      this.#discovered[peer.id]?._handleMessage(new Uint8Array(Object.values(data)), id, from)
      this.bw.down += data.length || data.byteLength
    })

    this.on('data', async (peer, data) => {
      pubsub.publish('peernet:shard', {peer, data})
    })
    console.log('Peer started as: ' + this._peerId)
    this.start()
  }
  
}
