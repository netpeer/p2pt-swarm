import P2PT from "@leofcoin/p2pt";
export default class P2PTPeer {
    #private;
    p2pt: P2PT;
    remotePeerId: any;
    localPeerId: any;
    initiator: boolean;
    state: any;
    get id(): any;
    get channelName(): any;
    get connected(): boolean;
    get channelConnected(): any;
    get connectionStats(): {
        family: any;
        address: any;
        port: any;
    };
    constructor(peer: any, p2pt: any, options?: {});
    _handleMessage(data: any, id: any, from: any): void;
    send(data: any, id: any): Promise<any>;
    request(data: any): Promise<any>;
    get peerId(): any;
}
