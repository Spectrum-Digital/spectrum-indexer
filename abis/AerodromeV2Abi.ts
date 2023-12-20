export const AerodromeV2Abi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'token0', type: 'address' },
      { indexed: true, internalType: 'address', name: 'token1', type: 'address' },
      { indexed: true, internalType: 'bool', name: 'stable', type: 'bool' },
      { indexed: false, internalType: 'address', name: 'pool', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'PoolCreated',
    type: 'event',
  },
] as const
