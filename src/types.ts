export type NodeStatus =
  | 'WaitingConsensus'
  | 'Synchronizing'
  | 'AlmostSynced'
  | 'Synced'

export type NodeInfo = { name: string; host: string; port: number }

export enum MessageType {
  Success,
  Error
}
