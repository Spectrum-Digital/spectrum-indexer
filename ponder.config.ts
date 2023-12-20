import { createConfig } from '@ponder/core'
import { http } from 'viem'

import { AerodromeV2Abi } from './abis/AerodromeV2Abi'
import { CamelotAbi } from './abis/CamelotAbi'
import { SpookySwapV2Abi } from './abis/SpookySwapV2Abi'

export default createConfig({
  networks: {
    ['arbitrum-one']: {
      chainId: 42161,
      transport: http(process.env.PONDER_RPC_URL_42161),
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
    fantom: {
      chainId: 250,
      transport: http(process.env.PONDER_RPC_URL_250),
    },
  },
  contracts: {
    AerodromeV2: {
      network: 'base',
      abi: AerodromeV2Abi,
      address: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
      startBlock: 3200559,
    },
    Camelot: {
      network: 'arbitrum-one',
      abi: CamelotAbi,
      address: '0x6EcCab422D763aC031210895C81787E87B43A652',
      startBlock: 35061163,
    },
    SpookySwapV2: {
      network: 'fantom',
      abi: SpookySwapV2Abi,
      address: '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3',
      startBlock: 3795376,
    },
  },
})
