import { ponder } from '@/generated'
import { ERC20Abi } from '../abis/ERC20Abi'

type Address = `0x${string}`
type TokenData = { name: string; symbol: string; decimals: number }
type PoolCreated = Parameters<Parameters<typeof ponder.on<'AerodromeV2:PoolCreated'>>[1]>[0]
type PairCreated = Parameters<Parameters<typeof ponder.on<'Camelot:PairCreated'>>[1]>[0]
type IsomorphicEvent = PoolCreated['event'] | PairCreated['event']
type IsomorphicContext = { client: PairCreated['context']['client']; db: PairCreated['context']['db'] }

// Main subscriptions
ponder.on('AerodromeV2:PoolCreated', async ({ event, context }) => onPoolCreated(event, context))
ponder.on('Camelot:PairCreated', async ({ event, context }) => onPoolCreated(event, context))
ponder.on('SpookySwapV2:PairCreated', async ({ event, context }) => onPoolCreated(event, context))

async function onPoolCreated(event: IsomorphicEvent, context: IsomorphicContext): Promise<void> {
  const pair = event.name === 'PoolCreated' ? event.args.pool : event.args.pair
  const initialData = await _fetchInitialData(context, pair, event.args.token0, event.args.token1)
  if (!initialData) return console.log(`Failed to fetch initial data for ${pair}`)

  const factory = await _upsertPoolFactory(event, context)
  const token0 = await _upsertToken(context, event.args.token0, initialData.token0)
  const token1 = await _upsertToken(context, event.args.token1, initialData.token1)
  const stable = 'stable' in event.args ? event.args.stable : false
  const chainId = context.client.chain?.id ?? 0

  const pool = await context.db.Pool.create({
    id: _generateId(pair, chainId),
    data: {
      address: pair,
      chainId: chainId,
      blockNumber: event.block.number,
      factory: factory.id,
      decimals: initialData.pool.decimals,
      token0Id: token0.id,
      token1Id: token1.id,
      stable: stable,
    },
  })

  console.log(`Created pool ${pool.id} with ${token0.symbol}:${token1.symbol}`)
}

function _generateId(address: Address, chainId: number) {
  return `${address}-${chainId}`
}

async function _upsertPoolFactory(event: IsomorphicEvent, context: IsomorphicContext) {
  const chainId = context.client.chain?.id ?? 0
  const factory = await context.db.PoolFactory.upsert({
    id: _generateId(event.log.address, chainId),
    create: { address: event.log.address, chainId: chainId },
    update: {},
  })
  return factory
}

async function _upsertToken(context: IsomorphicContext, address: Address, data: TokenData) {
  const chainId = context.client.chain?.id ?? 0
  const token = await context.db.Token.upsert({
    id: _generateId(address, chainId),
    create: { ...data, address, chainId },
    update: {},
  })
  return token
}

async function _fetchInitialData(
  context: IsomorphicContext,
  pool: Address,
  token0: Address,
  token1: Address
): Promise<{
  pool: { decimals: number }
  token0: TokenData
  token1: TokenData
} | null> {
  try {
    const result = await context.client.multicall({
      contracts: [
        { address: pool, abi: ERC20Abi, functionName: 'decimals' },
        { address: token0, abi: ERC20Abi, functionName: 'name' },
        { address: token0, abi: ERC20Abi, functionName: 'symbol' },
        { address: token0, abi: ERC20Abi, functionName: 'decimals' },
        { address: token1, abi: ERC20Abi, functionName: 'name' },
        { address: token1, abi: ERC20Abi, functionName: 'symbol' },
        { address: token1, abi: ERC20Abi, functionName: 'decimals' },
      ],
      allowFailure: false,
    })

    return {
      pool: {
        decimals: result[0],
      },
      token0: {
        name: result[1],
        symbol: result[2],
        decimals: result[3],
      },
      token1: {
        name: result[4],
        symbol: result[5],
        decimals: result[6],
      },
    }
  } catch (err) {
    return null
  }
}
