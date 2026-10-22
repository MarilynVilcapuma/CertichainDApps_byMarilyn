// ---------------------------------------------------------------
// Capa de bajo nivel con las extensiones de wallet (Pali y MetaMask).
// Cuando hay varias extensiones instaladas, cada una compite por
// window.ethereum; la forma confiable de distinguirlas es EIP-6963
// (Multi Injected Provider Discovery): cada extensión se anuncia con su
// propio provider. window.pali / window.ethereum.providers quedan de respaldo.
// ---------------------------------------------------------------
import { BrowserProvider } from 'ethers'
import { obtenerRed } from './redes.js'

/** @typedef {'pali'|'metamask'} Extension */

/** @type {Map<string, { info: any, provider: any }>} */
const anuncios = new Map()

if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (evento) => {
    const detalle = /** @type {any} */ (evento).detail
    if (detalle?.info?.uuid) anuncios.set(detalle.info.uuid, detalle)
  })
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

/** @param {(info: any) => boolean} coincide */
function buscarEip6963(coincide) {
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  for (const { info, provider } of anuncios.values()) {
    if (coincide(info)) return provider
  }
  return null
}

/** @type {Record<Extension, { nombre: string, url: string, detectar: () => any }>} */
export const EXTENSIONES = {
  pali: {
    nombre: 'Pali Wallet',
    url: 'https://paliwallet.com/',
    detectar: () => {
      const via6963 = buscarEip6963((i) => /pali/i.test(i?.rdns ?? i?.name ?? ''))
      if (via6963) return via6963
      if (window.pali) return window.pali
      if (window.ethereum?.isPali) return window.ethereum
      return window.ethereum?.providers?.find?.((p) => p.isPali) ?? null
    }
  },
  metamask: {
    nombre: 'MetaMask',
    url: 'https://metamask.io/download/',
    detectar: () => {
      const via6963 = buscarEip6963((i) => /metamask/i.test(i?.rdns ?? i?.name ?? ''))
      if (via6963) return via6963
      // Pali puede anunciarse como MetaMask por compatibilidad: se excluye isPali
      if (window.ethereum?.isMetaMask && !window.ethereum?.isPali) return window.ethereum
      return window.ethereum?.providers?.find?.((p) => p.isMetaMask && !p.isPali) ?? null
    }
  }
}

/** @param {Extension} extension */
export function obtenerProveedor(extension) {
  return typeof window === 'undefined' ? null : EXTENSIONES[extension].detectar()
}

/**
 * Las extensiones pueden anunciarse unos milisegundos después de cargar la
 * página: reintenta brevemente antes de darse por vencido.
 * @param {Extension} extension
 */
export async function esperarProveedor(extension, intentos = 6) {
  for (let i = 0; i < intentos; i++) {
    const proveedor = obtenerProveedor(extension)
    if (proveedor) return proveedor
    await new Promise((r) => setTimeout(r, 100))
  }
  return null
}

/** BrowserProvider nuevo en cada uso: ethers cachea la red y fallaría tras un chainChanged. */
export function envolver(proveedor) {
  return new BrowserProvider(proveedor, 'any')
}

/**
 * Pide (o relee en silencio) las cuentas y devuelve la dirección activa.
 * @returns {Promise<string|null>}
 */
export async function leerCuenta(proveedor, pedirPermiso) {
  const cuentas = await proveedor.request({
    method: pedirPermiso ? 'eth_requestAccounts' : 'eth_accounts'
  })
  return cuentas?.[0] ?? null
}

export async function leerChainId(proveedor) {
  return Number(await proveedor.request({ method: 'eth_chainId' }))
}

/**
 * Cambia de red; si la billetera no la conoce (error 4902) la agrega primero.
 * @param {any} proveedor
 * @param {number} chainId
 */
export async function cambiarRed(proveedor, chainId) {
  const red = obtenerRed(chainId)
  if (!red) throw new Error(`La red ${chainId} no está soportada por esta DApp.`)

  try {
    await proveedor.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: red.hex }] })
  } catch (e) {
    const codigo = e?.code ?? e?.data?.originalError?.code
    if (codigo !== 4902) throw e
    await proveedor.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: red.hex,
          chainName: red.nombre,
          nativeCurrency: red.moneda,
          rpcUrls: red.rpc,
          blockExplorerUrls: [red.explorador]
        }
      ]
    })
  }
}

/**
 * Suscribe a los cambios de cuenta y de red. Devuelve la función de limpieza.
 * @param {any} proveedor
 * @param {{ onCuentas: (cuentas: string[]) => void, onRed: (chainId: number) => void }} manejadores
 */
export function escuchar(proveedor, { onCuentas, onRed }) {
  const cuentas = (lista) => onCuentas(lista ?? [])
  const red = (chainId) => onRed(Number(chainId))
  proveedor.on?.('accountsChanged', cuentas)
  proveedor.on?.('chainChanged', red)
  return () => {
    proveedor.removeListener?.('accountsChanged', cuentas)
    proveedor.removeListener?.('chainChanged', red)
  }
}

/** Traduce errores EIP-1193 y de ethers a mensajes cortos en español. */
export function traducirError(e, nombreWallet = 'la wallet') {
  const codigo = e?.code ?? e?.info?.error?.code
  if (codigo === 4001 || codigo === 'ACTION_REJECTED') return `Rechazaste la solicitud en ${nombreWallet}.`
  if (codigo === -32002) return `Ya hay una solicitud abierta: revisa ${nombreWallet}.`
  if (codigo === 4902) return 'La red no está agregada en la wallet.'
  return e?.shortMessage ?? e?.message ?? String(e)
}

/**
 * Fuerza a la wallet a mostrar de nuevo el selector de cuenta para este sitio.
 * Si ya hay un permiso concedido, wallet_requestPermissions lo devuelve sin
 * preguntar; por eso primero se revoca y luego se pide de nuevo.
 * @param {any} proveedor
 * @returns {Promise<string[]>}
 */
export async function reelegirCuenta(proveedor) {
  try {
    await proveedor.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] })
  } catch (e) {
    // Si la wallet no soporta revocar, se intenta pedir igualmente
    if (e?.code === 4001) throw e
  }
  return (await proveedor.request({ method: 'eth_requestAccounts' })) ?? []
}

/** ¿Este sitio ya tiene permiso para ver cuentas de la wallet? */
export async function tienePermiso(proveedor) {
  try {
    const permisos = await proveedor.request({ method: 'wallet_getPermissions' })
    return Array.isArray(permisos) && permisos.some((p) => p?.parentCapability === 'eth_accounts')
  } catch {
    // Sin soporte del método: se asume permiso si ya hay cuentas autorizadas
    return ((await proveedor.request({ method: 'eth_accounts' })) ?? []).length > 0
  }
}

/** Cuentas ya autorizadas para este sitio, sin abrir ningún popup. */
export async function leerCuentas(proveedor) {
  return (await proveedor.request({ method: 'eth_accounts' })) ?? []
}

/** Pide autorización (popup de la wallet la primera vez). */
export async function solicitarCuentas(proveedor) {
  return (await proveedor.request({ method: 'eth_requestAccounts' })) ?? []
}
