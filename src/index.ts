process.env.NTBA_FIX_319 = '1'

import TelegramBot from 'node-telegram-bot-api'
import { NodeStatusMonitor } from './NodeStatusMonitor'
import { createMessage } from './createMessage'
import { MessageType, NodeInfo } from './types'

import { WitnetNodeClient } from './WitnetNodeClient'
import { getNodeList } from './getNodeList'

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '60000') // 1min

main()

async function main () {
  if (!TOKEN) {
    throw new Error('Mandatory environment variable TOKEN is missing')
  }

  if (!CHANNEL_ID) {
    throw new Error('Mandatory environment variable CHANNEL_ID is missing')
  }
  console.log('Initialize telegram bot')
  const bot = new TelegramBot(TOKEN)

  console.log('Getting node list')
  const nodes = getNodeList(process.env)

  // initialize node clients
  console.log('Initialize node client')
  const clients = nodes.map(
    (nodeInfo: NodeInfo) => new WitnetNodeClient(nodeInfo)
  )

  const nodeStatusMonitor = new NodeStatusMonitor(clients, bot)

  // establish node clients connections
  const connectionPromises = clients.map(async client => await client.connect())
  await Promise.all(connectionPromises)


  const onTimeout = (client: WitnetNodeClient, index: number) => {
    nodeStatusMonitor.sendTelegramMessage(
      createMessage(
        client.nodeInfo,
        'Timeout after '+ process.env.TIMEOUT+'ms',
        MessageType.Error
      )
    )
    setTimeout(() => {
        clients[index] = new WitnetNodeClient(client.nodeInfo)
        clients[index].onTimeout(() => onTimeout(client, index))

        nodeStatusMonitor.sendTelegramMessage(
          createMessage(
            client.nodeInfo,
            'Trying to establish connection again ...',
            MessageType.Error
          )
        )
      }, 10000)
    }


  clients.forEach((client, index) => {
    client.onTimeout(() => onTimeout(client, index))
  })

  setInterval(async () => {
    try {
      nodeStatusMonitor.checkNodeStatus()
    } catch (error) {
      console.error(`Error checking node status ${error}`)
      nodeStatusMonitor.sendTelegramMessage(
        'Generic error checking node status'
      )
    }
  }, POLLING_INTERVAL)
}