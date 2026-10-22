// ---------------------------------------------------------------
// Catálogo de redes de CertiChain Perú.
// Los datos son los que exige `wallet_addEthereumChain` cuando la red
// todavía no está registrada en la billetera. El catálogo se heredó del
// proyecto paliWallet; solo Sepolia y Hoodi tienen CertiChain desplegado.
// ---------------------------------------------------------------

/**
 * @typedef {Object} Red
 * @property {number} chainId
 * @property {string} hex            chainId en hexadecimal (para wallet_switchEthereumChain)
 * @property {string} nombre
 * @property {'mainnet'|'testnet'} tipo
 * @property {{ name: string, symbol: string, decimals: number }} moneda
 * @property {string[]} rpc
 * @property {string} explorador     URL base, sin "/" final
 * @property {'etherscan'|'blockscout'} apiExplorador   cliente de historial a usar
 * @property {string} color          acento de la red en el selector
 * @property {string|null} contrato  dirección de CertiChain (null = no desplegado)
 */

/**
 * PENDIENTE: dirección de CertiChain en zkSYS Testnet (aún sin desplegar).
 * Basta con completarla aquí y la red queda habilitada.
 */
const CONTRATO_ZKSYS = null

/** @type {Record<number, Red>} */
export const REDES = {
  11155111: {
    chainId: 11155111,
    hex: '0xaa36a7',
    nombre: 'Sepolia',
    tipo: 'testnet',
    moneda: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpc: ['https://ethereum-sepolia-rpc.publicnode.com'],
    explorador: 'https://sepolia.etherscan.io',
    apiExplorador: 'etherscan',
    color: '#b58ee8',
    contrato: '0xCE742E5A880F3399F7b7536D59f0636f66e2291b'
  },
  560048: {
    chainId: 560048,
    hex: '0x88bb0',
    nombre: 'Hoodi',
    tipo: 'testnet',
    moneda: { name: 'Hoodi Ether', symbol: 'ETH', decimals: 18 },
    rpc: ['https://ethereum-hoodi-rpc.publicnode.com'],
    explorador: 'https://hoodi.etherscan.io',
    apiExplorador: 'etherscan',
    color: '#e05fa8',
    contrato: '0x2b453ac3c273398ffbfc51d3ca1527d88d802d89'
  },
  57057: {
    chainId: 57057,
    hex: '0xdee1',
    nombre: 'zkSYS Testnet',
    tipo: 'testnet',
    moneda: { name: 'Testnet Syscoin', symbol: 'TSYS', decimals: 18 },
    rpc: ['https://rpc-zk.tanenbaum.io'],
    explorador: 'https://explorer-zk.tanenbaum.io',
    apiExplorador: 'blockscout',
    color: '#3ddc97',
    contrato: CONTRATO_ZKSYS
  },
  57: {
    chainId: 57,
    hex: '0x39',
    nombre: 'Syscoin NEVM',
    tipo: 'mainnet',
    moneda: { name: 'Syscoin', symbol: 'SYS', decimals: 18 },
    rpc: ['https://rpc.syscoin.org'],
    explorador: 'https://explorer.syscoin.org',
    apiExplorador: 'blockscout',
    color: '#f7a600',
    contrato: null
  },
  5700: {
    chainId: 5700,
    hex: '0x1644',
    nombre: 'Syscoin Tanenbaum',
    tipo: 'testnet',
    moneda: { name: 'Testnet Syscoin', symbol: 'TSYS', decimals: 18 },
    rpc: ['https://rpc.tanenbaum.io'],
    explorador: 'https://tanenbaum.io',
    apiExplorador: 'blockscout',
    color: '#6c8cff',
    contrato: null
  },
  570: {
    chainId: 570,
    hex: '0x23a',
    nombre: 'Rollux',
    tipo: 'mainnet',
    moneda: { name: 'Syscoin', symbol: 'SYS', decimals: 18 },
    rpc: ['https://rpc.rollux.com'],
    explorador: 'https://explorer.rollux.com',
    apiExplorador: 'blockscout',
    color: '#00c2a8',
    contrato: null
  },
  57000: {
    chainId: 57000,
    hex: '0xdea8',
    nombre: 'Rollux Testnet',
    tipo: 'testnet',
    moneda: { name: 'Testnet Syscoin', symbol: 'TSYS', decimals: 18 },
    rpc: ['https://rpc-tanenbaum.rollux.com'],
    explorador: 'https://rollux.tanenbaum.io',
    apiExplorador: 'blockscout',
    color: '#9b7bff',
    contrato: null
  },
  1: {
    chainId: 1,
    hex: '0x1',
    nombre: 'Ethereum Mainnet',
    tipo: 'mainnet',
    moneda: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpc: ['https://ethereum-rpc.publicnode.com'],
    explorador: 'https://etherscan.io',
    apiExplorador: 'etherscan',
    color: '#627eea',
    contrato: null
  },
  17000: {
    chainId: 17000,
    hex: '0x4268',
    nombre: 'Holesky',
    tipo: 'testnet',
    moneda: { name: 'Holesky Ether', symbol: 'ETH', decimals: 18 },
    rpc: ['https://ethereum-holesky-rpc.publicnode.com'],
    explorador: 'https://holesky.etherscan.io',
    apiExplorador: 'etherscan',
    color: '#5fb3e0',
    contrato: null
  },
  137: {
    chainId: 137,
    hex: '0x89',
    nombre: 'Polygon',
    tipo: 'mainnet',
    moneda: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpc: ['https://polygon-rpc.com'],
    explorador: 'https://polygonscan.com',
    apiExplorador: 'etherscan',
    color: '#8247e5',
    contrato: null
  },
  56: {
    chainId: 56,
    hex: '0x38',
    nombre: 'BNB Smart Chain',
    tipo: 'mainnet',
    moneda: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpc: ['https://bsc-dataseed.binance.org'],
    explorador: 'https://bscscan.com',
    apiExplorador: 'etherscan',
    color: '#f0b90b',
    contrato: null
  }
}

/** Redes con CertiChain primero y luego el resto por nombre (para el selector). */
export const LISTA_REDES = Object.values(REDES).sort(
  (a, b) => Number(Boolean(b.contrato)) - Number(Boolean(a.contrato)) || a.nombre.localeCompare(b.nombre)
)

/** @param {number|null|undefined} chainId @returns {Red|null} */
export function obtenerRed(chainId) {
  return chainId == null ? null : (REDES[chainId] ?? null)
}

/** Ficha de la red, o una genérica si no está catalogada. @returns {Red} */
export function describirRed(chainId) {
  return (
    obtenerRed(chainId) ?? {
      chainId,
      hex: `0x${chainId.toString(16)}`,
      nombre: `Red personalizada #${chainId}`,
      tipo: 'testnet',
      moneda: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpc: [],
      explorador: '',
      apiExplorador: 'etherscan',
      color: '#8b93a7',
      contrato: null
    }
  )
}

/** @param {number|null|undefined} chainId */
export function contratoDeRed(chainId) {
  return obtenerRed(chainId)?.contrato ?? null
}

/** Enlace al explorador para una transacción: `explorador/tx/{hash}`. */
export function urlTx(chainId, hash) {
  const red = obtenerRed(chainId)
  return red?.explorador ? `${red.explorador}/tx/${hash}` : null
}
