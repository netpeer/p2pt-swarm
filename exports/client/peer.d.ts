import LittlePubSub from '@vandeurenglenn/little-pubsub';
import P2PTClient from "./client.js";
export declare namespace globalThis {
    var pubsub: LittlePubSub;
}
export default class P2PTPeer {
    #private;
    p2pt: P2PTClient;
    remotePeerId: any;
    localPeerId: any;
    initiator: boolean;
    state: any;
    bw: {
        up: number;
        down: number;
    };
    options: {};
    get id(): any;
    get channelName(): any;
    get connected(): boolean;
    get channelConnected(): any;
    get connectionStats(): {
        family: any;
        address: any;
        port: any;
    };
    constructor(peer: any, p2pt: P2PTClient, options?: {});
    _handleMessage(data: any, id: any, from: any): Promise<void>;
    send(data: any, id?: string): Promise<unknown>;
    request(data: any): Promise<any>;
    get peerId(): any;
}
