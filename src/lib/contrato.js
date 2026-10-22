// ---------------------------------------------------------------
// Acceso al contrato CertiChain: instancias por red, roles y errores.
// ---------------------------------------------------------------
import { Contract, Interface, JsonRpcProvider } from 'ethers'
import abi from './CertiChain.abi.json'
import { contratoDeRed, obtenerRed } from './redes.js'
import { envolver } from './wallet.js'

const interfaz = new Interface(abi)

/**
 * Contrato de solo lectura vía el RPC público de la red: no necesita wallet
 * (lo usa la pantalla Verificar). Devuelve null si CertiChain no está allí.
 * @param {number} chainId
 */
export function contratoPublico(chainId) {
  const direccion = contratoDeRed(chainId)
  const red = obtenerRed(chainId)
  if (!direccion || !red?.rpc?.length) return null
  return new Contract(direccion, abi, new JsonRpcProvider(red.rpc[0], chainId, { staticNetwork: true }))
}

/**
 * Contrato conectado a la wallet. Con `firmar` el contrato puede enviar
 * transacciones; sin él solo lee.
 * @param {any} proveedor proveedor EIP-1193 de la extensión
 * @param {number} chainId
 * @param {boolean} [firmar]
 */
export async function contratoConWallet(proveedor, chainId, firmar = false) {
  const direccion = contratoDeRed(chainId)
  if (!direccion) return null
  const provider = envolver(proveedor)
  return new Contract(direccion, abi, firmar ? await provider.getSigner() : provider)
}

/** @typedef {'admin'|'institucion'|'visitante'} Rol */

/**
 * Deduce el rol de una cuenta: Admin si es `admin()`, Institución si
 * `emisores(cuenta)` es true y Visitante en cualquier otro caso.
 * @param {Contract|null} contrato
 * @param {string} cuenta
 * @returns {Promise<{ rol: Rol, nombre: string }>}
 */
export async function obtenerRol(contrato, cuenta) {
  if (!contrato) return { rol: 'visitante', nombre: '' }
  const [admin, esEmisor] = await Promise.all([contrato.admin(), contrato.emisores(cuenta)])
  if (admin.toLowerCase() === cuenta.toLowerCase()) return { rol: 'admin', nombre: '' }
  if (esEmisor) return { rol: 'institucion', nombre: await contrato.nombreInstitucion(cuenta) }
  return { rol: 'visitante', nombre: '' }
}

const MENSAJES_ERROR = {
  NoAutorizado: 'No tienes permiso para realizar esta acción.',
  YaRegistrado: 'Ya está registrado.',
  NoExiste: 'No existe en esta red.',
  YaRevocado: 'El certificado ya fue revocado.',
  DireccionInvalida: 'La dirección no es válida.',
  HashInvalido: 'El código del certificado no es válido.',
  DatosIncompletos: 'Faltan datos obligatorios.',
  TarifaIncorrecta: 'El pago no coincide con la tarifa vigente. Actualiza la página e inténtalo de nuevo.',
  SinFondos: 'El contrato no tiene fondos para retirar.',
  TransferenciaFallida: 'No se pudo completar la transferencia.'
}

/**
 * Traduce un error de ethers o del contrato a un mensaje corto en español.
 * @param {any} e
 */
export function mensajeErrorContrato(e) {
  const codigo = e?.code ?? e?.info?.error?.code
  if (codigo === 'ACTION_REJECTED' || codigo === 4001) return 'Rechazaste la firma en la wallet.'

  const datos = e?.data ?? e?.info?.error?.data ?? e?.error?.data
  if (typeof datos === 'string' && datos.startsWith('0x') && datos.length >= 10) {
    const error = interfaz.parseError(datos)
    if (error && MENSAJES_ERROR[error.name]) return MENSAJES_ERROR[error.name]
  }
  if (e?.revert?.name && MENSAJES_ERROR[e.revert.name]) return MENSAJES_ERROR[e.revert.name]
  if (codigo === 'INSUFFICIENT_FUNDS') return 'Saldo insuficiente para pagar el monto y el gas.'
  return e?.shortMessage ?? e?.reason ?? e?.message ?? String(e)
}

/** Traduce el selector de 4 bytes de una transacción (`0xb64bb771`) al nombre del método. */
export function nombreMetodo(input) {
  if (!input || input === '0x') return 'Transferencia'
  try {
    return interfaz.getFunction(input.slice(0, 10))?.name ?? input.slice(0, 10)
  } catch {
    return input.slice(0, 10)
  }
}
