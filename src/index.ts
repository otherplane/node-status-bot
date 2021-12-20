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

  console.log('Initialize nodeStatusMonitor')
  const nodeStatusMonitor = new NodeStatusMonitor(clients, bot)

  const onTimeoutOrError = (client: WitnetNodeClient, index: number) => {
    console.log('Inside onTimeoutOrError')
    nodeStatusMonitor.sendTelegramMessage(
      createMessage(
        client.nodeInfo,
        'Timeout after ' + process.env.TIMEOUT + 'ms',
        MessageType.Error
      )
    )
    setTimeout(() => {
      console.log('Creating new client for', client.nodeInfo.name)
      clients[index] = new WitnetNodeClient(client.nodeInfo)
      console.log('setting onTimeoutOrError for client', client.nodeInfo.name)
      clients[index].onTimeoutOrError(() => onTimeoutOrError(client, index))

      nodeStatusMonitor.sendTelegramMessage(
        createMessage(
          client.nodeInfo,
          'Trying to establish connection again ...',
          MessageType.Error
        )
      )

      clients[index].connect()
    }, parseInt(process.env.TIMEOUT || '5000'))
  }

  clients.forEach((client, index) => {
    console.log('setting onTimeoutOrError for client', client.nodeInfo.name)
    client.onTimeoutOrError(() => onTimeoutOrError(client, index))
  })
  // establish node clients connections
  console.log('Connecting clients')
  const connectionPromises = clients.map(async client => await client.connect())
  await Promise.all(connectionPromises)

  setInterval(async () => {
    console.log('Checking node status')
    nodeStatusMonitor.checkNodeStatus().catch(e => {
      console.log('Error checking node status in client with index', e)
      if (typeof e === 'number') {
        const index: number = e
        clients[index] = new WitnetNodeClient(clients[index].nodeInfo)
        clients[index].onTimeoutOrError(() =>
          onTimeoutOrError(clients[index], index)
        )
        clients[index].connect()
      }

      nodeStatusMonitor.sendTelegramMessage(
        'Generic error checking node status'
      )
    })
  }, POLLING_INTERVAL)
}
