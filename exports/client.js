import P2PT from '@leofcoin/p2pt';
import LittlePubSub from '@vandeurenglenn/little-pubsub';
import { fromBase58 } from '@vandeurenglenn/typed-array-utils';
import '@vandeurenglenn/base58';

class P2PTPeer {
    p2pt;
    remotePeerId;
    localPeerId;
    #peerId;
    #channelName;
    initiator = false;
    state;
    #connection;
    bw;
    options;
    get id() {
        return this.#connection.id;
    }
    get channelName() {
        return this.#channelName;
    }
    get connected() {
        let connected = false;
        if (Object.keys(this.p2pt.peers).length === 0)
            return connected;
        if (!this.p2pt.peers[this.id])
            return connected;
        for (const channelId of Object.keys(this.p2pt.peers[this.id])) {
            if (this.p2pt.peers[this.id][channelId].connected) {
                connected = true;
                break;
            }
        }
        return connected;
    }
    // check if channel is connected, if not, consider changing to a connected channel
    get channelConnected() {
        return this.#connection.connected;
    }
    get connectionStats() {
        return {
            family: this.#connection.remoteFamily || this.#connection.localFamily || 'ipv4',
            address: this.#connection.remoteAddress || this.#connection.localAddress || '127.0.0.1',
            port: this.#connection.remotePort || this.#connection.localPort || '0000',
        };
    }
    constructor(peer, p2pt, options = {}) {
        this.#connection = peer;
        this.p2pt = p2pt;
        this.localPeerId = this.p2pt.peerId;
        this.bw = {
            up: 0,
            down: 0
        };
        this.#channelName = peer.channelName;
        this.#peerId = this.p2pt.peerId;
        this.options = options;
    }
    async _handleMessage(data, id, from) {
        // data = await inflate(data)
        // console.log(new TextDecoder().decode(new Uint8Array(Object.values(JSON.parse(message.msg)))));
        globalThis.pubsub.publish('peer:data', { id, data, from, peer: this });
        this.bw.down += data.byteLength || data.length;
    }
    async send(data, id) {
        // data = await deflate(data)
        this.bw.up += data.byteLength || data.length;
        return this.p2pt.send(this.#connection, data, id);
    }
    async request(data) {
        // @ts-ignore
        const [peer, msg] = await this.send(data);
        return msg;
    }
    get peerId() {
        return this.#peerId;
    }
}

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
