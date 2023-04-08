import P2PT from '@leofcoin/p2pt';
import LittlePubSub from '@vandeurenglenn/little-pubsub/index.js';

class P2PTPeer {
    p2pt;
    remotePeerId;
    localPeerId;
    #peerId;
    #channelName;
    initiator = false;
    state;
    #connection;
    get id() {
        return this.#connection.id;
    }
    get channelName() {
        return this.#channelName;
    }
    get connected() {
        let connected = false;
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
    _handleMessage(data, id, from) {
        // console.log(new TextDecoder().decode(new Uint8Array(Object.values(JSON.parse(message.msg)))));
        pubsub.publish('peer:data', { id, data, from, peer: this });
        this.bw.down += data.byteLength || data.length;
    }
    async send(data, id) {
        this.bw.up += data.byteLength || data.length;
        return this.p2pt.send(this.#connection, data, id);
    }
    async request(data) {
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
    get discovered() {
        return this.#discovered || {};
    }
    constructor(peerId, networkVersion = 'leofcoin:peach', stars = ['wss://peach.leofcoin.org']) {
        super(stars, networkVersion, peerId);
        this.stars = stars;
        this.networkVersion = networkVersion;
        this.peerId = peerId;
        this.on('trackerconnect', async (tracker, stats) => {
            const peers = await this.requestMorePeers();
            let promises = Object.entries(peers).map(async ([id, peer]) => {
                const hasPeer = this.#discovered[id];
                if (!hasPeer)
                    this.#discovered[id] = await new P2PTPeer(peer, this);
                if (!hasPeer && this.#discovered[id].connected)
                    pubsub.publish('peer:discovered', this.#discovered[id]);
            });
            promises = await Promise.allSettled(promises);
            pubsub.publish('star:connected', tracker);
        });
        this.on('peerconnect', async (peer) => {
            if (!this.#discovered[peer.id])
                this.#discovered[peer.id] = await new P2PTPeer(peer, this);
            if (this.#discovered[peer.id].connected)
                pubsub.publish('peer:discovered', this.#discovered[peer.id]);
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
        });
        this.on('peerclose', async (peer) => {
            if (this.#discovered[peer.id]) {
                pubsub.publish('peer:left', this.#discovered[peer.id]);
                delete this.#discovered[peer.id];
            }
        });
        this.on('msg', async (peer, data, id, from) => {
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
                this.#discovered[peer.id]?._handleMessage(new Uint8Array(Object.values(data)), id, from);
                this.bw.down += data.length || data.byteLength;
            }
        });
        this.on('data', async (peer, data) => {
            pubsub.publish('peernet:shard', { peer, data });
        });
        console.log('Peer started as: ' + this._peerId);
        this.start();
    }
}

export { P2PTClient as default };
