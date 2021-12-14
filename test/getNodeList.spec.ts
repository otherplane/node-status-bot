import { getNodeList } from '../src/getNodeList'
import { MessageType } from '../src/types'

describe('createMessage', () => {
  const nodeInfo = { name: 'Node1', host: '192.1.1.1', port: 21338 }
  const text = 'message'

  it('should get a single node from the object given if there is only 1 element', () => {
    const nodeList1 = {
      NODE_0_NAME: 'node_0_name',
      NODE_0_HOST: '190.0.0.0',
      NODE_0_PORT: 21337
    }
    const nodes = getNodeList(nodeList1)

    expect(nodes.length).toBe(1)
    expect(nodes).toStrictEqual([
      { name: 'node_0_name', host: '190.0.0.0', port: 21337 }
    ])
  })

  it('should get multiples nodes from the object given if there is only 1 element', () => {
    const nodeList1 = {
      NODE_0_NAME: 'node_0_name',
      NODE_0_HOST: '190.0.0.0',
      NODE_0_PORT: 21337,
      NODE_1_NAME: 'node_1_name',
      NODE_1_HOST: '191.1.1.1',
      NODE_1_PORT: 21337
    }
    const nodes = getNodeList(nodeList1)

    expect(nodes.length).toBe(2)
    expect(nodes).toStrictEqual([
      { name: 'node_0_name', host: '190.0.0.0', port: 21337 },
      { name: 'node_1_name', host: '191.1.1.1', port: 21337 }
    ])
  })

  it('should get 21338 as default port', () => {
    const nodeList1 = {
      NODE_0_NAME: 'node_0_name',
      NODE_0_HOST: '190.0.0.0'
    }
    const nodes = getNodeList(nodeList1)

    expect(nodes).toStrictEqual([
      { name: 'node_0_name', host: '190.0.0.0', port: 21338 }
    ])
  })
})
