# p2pt-swarm

## install
```sh
npm i @netpeer/p2pt-swarm
```
## usage

### client
```js
import {Client} from '@netpeer/p2pt-swarm'
const stars = ['ws://127.0.0.1:44444', 'wss://peach.leofcoin.org']
const networkVersion = 'leofcoin:peach'
const peerId = '...'
const client = await new Client(stars, networkVersion, peerId)
client.discovered // discovered peers
```

### server (star)
```js
import {Server} from '@netpeer/p2pt-swarm'
const port = 44444
new Server(port)
```