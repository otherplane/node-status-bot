import { createMessage } from '../src/createMessage'
import { MessageType } from '../src/types'

describe('createMessage', () => {
  const nodeInfo = { name: 'Node1', host: '192.1.1.1', port: 21338 }
  const text = 'message'

  it('should include the success emoji if message type is success', () => {
    const messageType = MessageType.Success

    const message = createMessage(nodeInfo, text, messageType)

    expect(message.includes('✅')).toBeTruthy()
  })

  it('should include the error emoji if message type is error', () => {
    const messageType = MessageType.Error

    const message = createMessage(nodeInfo, text, messageType)

    expect(message.includes('❌')).toBeTruthy()
  })

  it('should include the node name', () => {
    const messageType = MessageType.Error

    const message = createMessage(nodeInfo, text, messageType)

    expect(message.includes(nodeInfo.name)).toBeTruthy()
  })

  it('should include the node host', () => {
    const messageType = MessageType.Error

    const message = createMessage(nodeInfo, text, messageType)

    expect(message.includes(nodeInfo.host)).toBeTruthy()
  })

  it('should include the message', () => {
    const messageType = MessageType.Error

    const message = createMessage(nodeInfo, text, messageType)

    expect(message.includes(message)).toBeTruthy()
  })

  it('should have the structure [icon] [nodeInfo] [message]', () => {
    const messageType = MessageType.Error

    const message = createMessage(nodeInfo, text, messageType)

    expect(message).toBe('❌ Node1(192.1.1.1) message')
  })
})
