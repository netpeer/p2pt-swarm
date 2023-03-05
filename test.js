import Client from './src/client/client.js'
import Server from './src/server/server.js'

// const server = new Server(5001)
//  new Server(5002)

  for (let i = 1; i <= 2; i++) {
    setTimeout(() => {
      const client = new Client({peerId: i})
    }, 1000 * i)
  }
 
