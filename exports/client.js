import P2PT from '@leofcoin/p2pt';
import P2PTPeer from './peer.js';
import LittlePubSub from '@vandeurenglenn/little-pubsub';
import { fromBase58 } from '@vandeurenglenn/typed-array-utils';
import '@vandeurenglenn/base58';

if (!globalThis.pubsub)
    globalThis.pubsub = new LittlePubSub();
class P2PTClient extends P2PT {
    #discovered = {};
    #que = new Map();
    bw = {
        up: 0,
        down: 0
    };
    stars;
    networkVersion;
    peerId;
    get discovered() {
        return this.#discovered || {};
    }
    constructor(peerId, networkVersion = 'leofcoin:peach', stars = ['wss://peach.leofcoin.org']) {
        // @ts-ignore
        super(stars, networkVersion, fromBase58(peerId));
        this.stars = stars;
        this.networkVersion = networkVersion;
        this.peerId = peerId;
        // @ts-ignore
        this.on('trackerconnect', this.#onTrackerconnect);
        // @ts-ignore
        this.on('peerconnect', this.#onPeerconnect);
        // @ts-ignore
        this.on('peerclose', this.#onPeerclose);
        // @ts-ignore
        this.on('msg', this.#onMessage);
        // @ts-ignore
        this.on('data', async (peer, data) => {
            globalThis.pubsub.publish('peernet:shard', { peer, data });
        });
        console.log('Peer started as: ' + this.peerId);
        this.start();
    }
    #onTrackerconnect = async (tracker, stats) => {
        const peers = await this.requestMorePeers();
        let promises = Object.entries(peers).map(async ([id, peer]) => {
            const hasPeer = this.#discovered[id];
            if (!hasPeer)
                this.#discovered[id] = await new P2PTPeer(peer, this);
            if (!hasPeer && this.#discovered[id].connected)
                globalThis.pubsub.publish('peer:discovered', this.#discovered[id]);
        });
        await Promise.allSettled(promises);
        globalThis.pubsub.publish('star:connected', tracker);
    };
    #onPeerconnect = async (peer) => {
        if (!this.#discovered[peer.id])
            this.#discovered[peer.id] = new P2PTPeer(peer, this);
        if (this.#discovered[peer.id].connected)
            globalThis.pubsub.publish('peer:discovered', this.#discovered[peer.id]);
        if (this.#que.has(peer.id)) {
            const set = this.#que.get(peer.id);
            for (const item of set.values()) {
                if (this.#discovered[peer.id]?.connected) {
                    await this.#discovered[peer.id]?._handleMessage(new Uint8Array(Object.values(item.data)), item.id, item.from);
                    this.bw.down += item.data.length || item.data.byteLength;
                    set.delete(item);
                }
            }
            if (set.size === 0)
                this.#que.delete(peer.id);
            else
                this.#que.set(peer.id, set);
        }
    };
    #onPeerclose = async (peer) => {
        if (this.#discovered[peer.id]) {
            globalThis.pubsub.publish('peer:left', this.#discovered[peer.id]);
            delete this.#discovered[peer.id];
        }
    };
    #onMessage = async (peer, data, id, from) => {
        if (!this.#discovered[peer.id] ||
            this.#discovered[peer.id]?.connected === false ||
            this.#discovered[peer.id]?.connected === undefined) {
            if (this.#que.has(peer.id)) {
                const set = this.#que.get(peer.id);
                set.add({ peer, data, id, from });
                this.#que.set(peer.id, set);
            }
            else {
                this.#que.set(peer.id, new Set([{ peer, data, id, from }]));
            }
        }
        else if (this.#discovered[peer.id]?.connected === true) {
            await this.#discovered[peer.id]?._handleMessage(new Uint8Array(Object.values(data)), id, from);
            this.bw.down += data.length || data.byteLength;
        }
    };
}

export { P2PTClient as default };
