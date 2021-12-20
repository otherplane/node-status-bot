import { Socket } from 'net'
import { NodeInfo, NodeStatus } from './types'

export class WitnetNodeClient {
  public socket: Socket
  public nodeInfo: NodeInfo
  public connected: Boolean

  constructor (nodeInfo: NodeInfo) {
    this.nodeInfo = nodeInfo
    this.socket = new Socket()
    //TODO: avoid unlimited listeners
    this.socket.setMaxListeners(0)
    this.socket.setTimeout(parseInt(process.env.TIMEOUT || '5000'))
    console.log('constructor: this.connected = false')
    this.connected = false
  }

  private async callApiMethod (
    methodName: string,
    params: {} = {},
    callbackDone?: (param?: any) => void
  ): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: '1',
      method: methodName,
      params: params
    }
    this.socket.write(`${JSON.stringify(request)}`)
    this.socket.write('\n')

    const result = await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('Timeout calling api method')
      }, parseInt(process.env.TIMEOUT || '5000'))
      let content = ''
      const onDataHandler = (chunk: Buffer) => {
        content += chunk.toString()
        if (chunk.toString().includes('\n')) {
          const result = JSON.parse(content)?.result
          if (result) {
            resolve(JSON.parse(content)?.result)
          } else {
            reject(JSON.parse(content)?.error.message)
          }
          content = ''
          this.socket.removeListener('data', onDataHandler)
        }
      }

      this.socket.on('data', onDataHandler)

      this.socket.on('close', () => {
        console.log('[callApiMethod]: close event fired')
        this.connected = false
        if (callbackDone) {
          callbackDone(result)
          this.socket.removeListener('data', onDataHandler)
        }
      })
    })

    return result
  }

  async connect () {
    return new Promise((resolve, reject) => {
      this.socket.connect(this.nodeInfo.port, this.nodeInfo.host, () => {
        console.log(this.nodeInfo.name + ' Connection established')
        this.connected = true
        resolve(null)
      })
    })
  }

  // getNode status
  public syncStatus (): Promise<{ node_state: NodeStatus }> {
    return this.callApiMethod('syncStatus')
  }

  public onTimeoutOrError (cb: (...args: any[]) => void): void {
    this.socket.on('timeout', () => {
      // TODO: Research why always enter here besides the connection was established
    })

    this.socket.on('error', () => {
      cb()
      console.log('[onTimeoutOrError]: onError event fired')
      this.connected = false
      this.socket.end()
      this.socket.on('end', () => {
        cb()
      })
      this.socket.destroy()
    })
  }
}
