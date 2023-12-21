import { ponder } from '@/generated'

export type Address = `0x${string}`
export type TokenData = { name: string; symbol: string; decimals: number }

type PoolCreated = Parameters<Parameters<typeof ponder.on<'AerodromeV2:PoolCreated'>>[1]>[0]
type PairCreated = Parameters<Parameters<typeof ponder.on<'Camelot:PairCreated'>>[1]>[0]
export type Event = PoolCreated['event'] | PairCreated['event']
