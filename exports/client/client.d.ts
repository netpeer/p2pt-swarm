import P2PT from '@leofcoin/p2pt';
import P2PTPeer from "./peer.js";
import '@vandeurenglenn/base58';
export declare type PeerId = base58String;
export default class P2PTClient extends P2PT {
    #private;
    bw: {
        up: number;
        down: number;
    };
    stars: string[];
    networkVersion: string;
    peerId: string;
    get discovered(): {
        [index: string]: P2PTPeer;
    };
    constructor(peerId: any, networkVersion?: string, stars?: string[]);
}
