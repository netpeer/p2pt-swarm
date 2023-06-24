import Client from './exports/client.js'
import Server from './exports/server.js'

const clients = []
// const server = new Server(5001)
//  new Server(5002)
const addresses = [
  'YTqwTAojA8aZDPYhSFey3KsYb66YdEa4Xe7L6E484VTfMSVvauLZd',
  'YTqwTAojA8aZDPYhSFey3KsYb66YdEa4Xe7L6E484VTfMSVvauLZa'
]

let data = ''

for (let i = 0; i < 1000; i++) {
  data += 'hello'
}

pubsub.subscribe('peer:discovered', peer => {
  console.log(peer);
  peer.send(new TextEncoder().encode(data))
})

pubsub.subscribe('peer:data', ({data}) => {
  console.log(new TextDecoder().decode(data));
  
})

  for (let i = 1; i <= 2; i++) {
    setTimeout(() => {
      const client = new Client(addresses[i - 1], 'leofcoin:peach', ['ws://127.0.0.1:44444'])
      client.on('peer:discovered', peer => {
        console.log(peer);
      })
      clients.push(client)
    }, 1000 * i)
  }

 