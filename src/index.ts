import { Context, ponder } from '@/generated'
import { ERC20Abi } from '../abis/ERC20Abi'
import { Address, Event, TokenData } from './typings'

// Main subscriptions
ponder.on('AerodromeV2:PoolCreated', async ({ event, context }) => onPoolCreated(event, context))
ponder.on('Camelot:PairCreated', async ({ event, context }) => onPoolCreated(event, context))
ponder.on('SpookySwapV2:PairCreated', async ({ event, context }) => onPoolCreated(event, context))

async function onPoolCreated(event: Event, context: Context): Promise<void> {
  const pair = event.name === 'PoolCreated' ? event.args.pool : event.args.pair
  const initialData = await _fetchInitialData(context, pair, event.args.token0, event.args.token1)
  if (!initialData) return console.log(`Detected broken ERC20 within pair: ${pair}`)

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

async function _upsertPoolFactory(event: Event, context: Context) {
  const chainId = context.network.chainId
  const factory = await context.db.PoolFactory.upsert({
    id: _generateId(event.log.address, chainId),
    create: { address: event.log.address, chainId },
    update: {},
  })
  return factory
}

async function _upsertToken(context: Context, address: Address, data: TokenData) {
  const chainId = context.network.chainId
  const token = await context.db.Token.upsert({
    id: _generateId(address, chainId),
    create: { ...data, address, chainId },
    update: {},
  })
  return token
}

async function _fetchInitialData(
  context: Context,
  pool: Address,
  token0: Address,
  token1: Address
): Promise<{
  pool: { decimals: number }
  token0: TokenData
  token1: TokenData
} | null> {
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
    allowFailure: true,
  })

  // Gather results
  const poolDecimals = result[0]['result']
  const token0Name = result[1]['result']
  const token0Symbol = result[2]['result']
  const token0Decimals = result[3]['result']
  const token1Name = result[4]['result']
  const token1Symbol = result[5]['result']
  const token1Decimals = result[6]['result']

  // Check for failures, we could use allowFailure: false but that wouldn't
  // allow us to make a distinction between call failure and RPC failure
  if (
    !poolDecimals ||
    !token0Name ||
    !token0Symbol ||
    !token0Decimals ||
    !token1Name ||
    !token1Symbol ||
    !token1Decimals
  ) {
    return null
  }

  return {
    pool: {
      decimals: poolDecimals,
    },
    token0: {
      name: token0Name,
      symbol: token0Symbol,
      decimals: token0Decimals,
    },
    token1: {
      name: token1Name,
      symbol: token1Symbol,
      decimals: token1Decimals,
    },
  }
}
