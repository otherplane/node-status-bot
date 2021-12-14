import { MessageType, NodeInfo } from './types'

export function createMessage (
  nodeInfo: NodeInfo,
  message: string,
  type: MessageType
): string {
  const messageIcons: Record<MessageType, string> = {
    [MessageType.Error]: '❌',
    [MessageType.Success]: '✅'
  }

  return `${messageIcons[type]} ${nodeInfo.name}(${nodeInfo.host}) ${message}`
}
