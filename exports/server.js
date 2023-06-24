import { Server } from 'bittorrent-tracker';

class server {
    server;
    port;
    constructor(port) {
        this.port = port;
        this.server = new Server({
            udp: false,
            http: true,
            ws: true,
            stats: false
        });
        this.server.on('warning', this.#warning.bind(this));
        this.server.on('listening', this.#listening.bind(this));
        this.server.on('start', this.#start.bind(this));
        this.server.on('update', this.#update.bind(this));
        this.server.listen(this.port || '5001', '0.0.0.0');
    }
    #start(id) {
        console.log('got start message from ' + id);
    }
    #update(id) {
        console.log('update from ' + id);
    }
    #listening() {
        console.log('listening on http port:' + this.server.http.address().port);
    }
    #warning(warning) {
        console.warn(warning.message);
    }
    #error(error) {
        console.error(error.message);
    }
}

export { server as default };
