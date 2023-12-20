import { createSchema } from '@ponder/core'

export default createSchema((p) => ({
  PoolFactory: p.createTable({
    id: p.string(),
    address: p.bytes(),
    chainId: p.int(),
    pools: p.many('Pool.factory'),
  }),
  Pool: p.createTable({
    id: p.string(),
    address: p.bytes(),
    chainId: p.int(),
    blockNumber: p.bigint(),
    factory: p.string().references('PoolFactory.id'),
    decimals: p.int(),
    token0: p.one('token0Id'),
    token1: p.one('token1Id'),
    token0Id: p.string().references('Token.id'),
    token1Id: p.string().references('Token.id'),
    stable: p.boolean(),
  }),
  Token: p.createTable({
    id: p.string(),
    address: p.bytes(),
    chainId: p.int(),
    name: p.string(),
    symbol: p.string(),
    decimals: p.int(),
  }),
}))
