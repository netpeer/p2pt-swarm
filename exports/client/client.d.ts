import P2PT from "@leofcoin/p2pt";
export default class P2PTClient extends P2PT {
    #private;
    bw: {
        up: number;
        down: number;
    };
    get discovered(): {};
    constructor(peerId: any, networkVersion?: string, stars?: string[]);
}
