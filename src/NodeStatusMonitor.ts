import TelegramBot from 'node-telegram-bot-api'
import { createMessage } from './createMessage'
import { MessageType, NodeStatus } from './types'

import { WitnetNodeClient } from './WitnetNodeClient'

export class NodeStatusMonitor {
  constructor (
    private witnetNodeClients: Array<WitnetNodeClient>,
    private telegramBot: TelegramBot,
    // store node name and its last status
    private state: Record<string, NodeStatus> = {}
  ) {}

  public async checkNodeStatus () {
    const promises = this.witnetNodeClients.map(
      async (witnetNodeClient, index) => {
        console.log(
          '[checkNodeStatus] client connected',
          JSON.stringify(witnetNodeClient.connected)
        )
        if (!witnetNodeClient.connected) return

        const {
          nodeInfo: { name }
        } = witnetNodeClient
        let node_state
        try {
          node_state = await (await witnetNodeClient.syncStatus()).node_state
        } catch (error) {
          console.error('ERROR calling syncstatus', error)
          throw index
        }

        if (node_state === this.state[name]) {
          console.log(
            '[checkNodeStatus] node_state is the same than previous call',
            node_state
          )
          return
        }

        if (node_state !== 'Synced') {
          this.sendTelegramMessage(
            createMessage(
              witnetNodeClient.nodeInfo,
              'is in status ' + node_state,
              MessageType.Error
            )
          )
        } else {
          this.sendTelegramMessage(
            createMessage(
              witnetNodeClient.nodeInfo,
              'is synced',
              MessageType.Success
            )
          )
        }

        this.state[name] = node_state
      }
    )
    await Promise.all(promises)

    return
  }

  public async sendTelegramMessage (message: string) {
    try {
      console.log('message', message)
      // if CHANNEL_ID is not found at the beginning will throw an error
      return await this.telegramBot.sendMessage(
        process.env.CHANNEL_ID as string,
        message
      )
    } catch (err) {
      console.error(err)
    }
  }
}
