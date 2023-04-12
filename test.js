import Client from './exports/client.js'
import Server from './exports/server.js'

// const server = new Server(5001)
//  new Server(5002)
const addresses = [
  'YTqwTAojA8aZDPYhSFey3KsYb66YdEa4Xe7L6E484VTfMSVvauLZd',
  'YTqwTAojA8aZDPYhSFey3KsYb66YdEa4Xe7L6E484VTfMSVvauLZa'
]

  for (let i = 1; i <= 2; i++) {
    setTimeout(() => {
      console.log(addresses[i - 1].length);
      
      const client = new Client(addresses[i - 1])
    }, 1000 * i)
  }
 
