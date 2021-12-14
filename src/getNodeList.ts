import { NodeInfo } from './types'

export function getNodeList (
  envVariables: Record<string, undefined | string | number>
): Array<NodeInfo> {
  let found = true
  const nodes: Array<NodeInfo> = []
  let counter = 0
  let name: string | undefined,
    host: string | undefined,
    port: string | undefined

  while (found) {
    name = envVariables[`NODE_${counter}_NAME`] as string
    host = envVariables[`NODE_${counter}_HOST`] as string
    port = envVariables[`NODE_${counter}_PORT`] as string

    if (name && host) {
      nodes.push({ name, host, port: port ? parseInt(port) : 21338 })
      counter += 1
    } else {
      found = false
    }
  }

  return nodes
}
