// ---------------------------------------------------------------
// Estado global de la sesión de wallet (runas de Svelte 5).
// Los componentes leen `sesion.*` y llaman a las acciones exportadas.
// ---------------------------------------------------------------
import { formatEther } from 'ethers'
import {
  EXTENSIONES,
  cambiarRed,
  envolver,
  escuchar,
  esperarProveedor,
  leerChainId,
  leerCuenta,
  leerCuentas,
  reelegirCuenta,
  solicitarCuentas,
  tienePermiso,
  traducirError
} from './wallet.js'
import { contratoDeRed, describirRed } from './redes.js'
import { abreviar } from './util.js'
import { contratoConWallet, obtenerRol } from './contrato.js'

const CLAVE_EXTENSION = 'certichain:extension'

export const sesion = $state({
  /** @type {import('./wallet.js').Extension|null} */
  extension: null,
  /** @type {string|null} */
  address: null,
  /** @type {number|null} */
  chainId: null,
  saldo: '0',
  /** @type {import('./contrato.js').Rol} */
  rol: 'visitante',
  nombreInstitucion: '',
  conectando: false,
  cambiandoRed: false,
  /** La cuenta activa de la wallet no está autorizada para esta página */
  cuentaSinAutorizar: false,
  /** Cuentas entre las que la persona debe elegir (vacío = no hay elección pendiente) */
  opcionesCuenta: /** @type {string[]} */ ([]),
  /** Mensaje informativo (cambio de cuenta o de red) */
  aviso: '',
  error: ''
})

/** Dirección del contrato en la red conectada (null si no hay o no está desplegado). */
export const contratoActual = () => contratoDeRed(sesion.chainId)

let proveedor = null

/** Proveedor EIP-1193 de la extensión conectada (para firmar transacciones). */
export const proveedorActivo = () => proveedor

/** Signer de ethers para la cuenta conectada (firma las transacciones). */
export async function obtenerSigner() {
  if (!proveedor) throw new Error('Conecta tu wallet para continuar.')
  return envolver(proveedor).getSigner()
}
let quitarEscucha = null

const nombreWallet = () => (sesion.extension ? EXTENSIONES[sesion.extension].nombre : 'la wallet')

// localStorage solo recuerda qué wallet usó la persona; puede fallar (modo privado)
function recordar(extension) {
  try {
    extension ? localStorage.setItem(CLAVE_EXTENSION, extension) : localStorage.removeItem(CLAVE_EXTENSION)
  } catch {
    /* sin almacenamiento: se omite la reconexión automática */
  }
}

export async function refrescarSaldo() {
  if (!proveedor || !sesion.address) return
  try {
    const wei = await envolver(proveedor).getBalance(sesion.address)
    sesion.saldo = formatEther(wei)
  } catch {
    sesion.saldo = '0'
  }
}

/** Relee el rol de la cuenta en la red conectada. */
export async function refrescarRol() {
  if (!proveedor || !sesion.address || !sesion.chainId) return
  const [cuenta, red] = [sesion.address, sesion.chainId]
  try {
    const contrato = await contratoConWallet(proveedor, red)
    const { rol, nombre } = await obtenerRol(contrato, cuenta)
    // Descarta el resultado si la cuenta o la red cambiaron mientras se consultaba
    if (cuenta !== sesion.address || red !== sesion.chainId) return
    sesion.rol = rol
    sesion.nombreInstitucion = nombre
  } catch {
    sesion.rol = 'visitante'
    sesion.nombreInstitucion = ''
  }
}

/** Saldo y rol: se llama tras cada transacción y cada cambio de cuenta o red. */
export async function refrescarTodo() {
  await Promise.all([refrescarSaldo(), refrescarRol()])
}

// ---- Elección de cuenta: solo se pregunta cuando la persona tiene varias ----

const CLAVE_CUENTAS = 'certichain:cuentas'

/** Cuentas distintas que la persona ya usó con esta wallet en este navegador. */
function cuentasConocidas(extension) {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CUENTAS) ?? '{}')[extension] ?? []
  } catch {
    return []
  }
}

function registrarCuenta(extension, address) {
  try {
    const todo = JSON.parse(localStorage.getItem(CLAVE_CUENTAS) ?? '{}')
    const lista = new Set([...(todo[extension] ?? []), address.toLowerCase()])
    localStorage.setItem(CLAVE_CUENTAS, JSON.stringify({ ...todo, [extension]: [...lista] }))
  } catch {
    /* sin almacenamiento: no se aprende, solo se pierde la sugerencia */
  }
}

let resolverEleccion = null

/** Muestra la ventana de la DApp para elegir entre varias cuentas. Devuelve null si se cancela. */
function pedirEleccion(cuentas) {
  sesion.opcionesCuenta = cuentas
  return new Promise((resolver) => (resolverEleccion = resolver))
}

/** @param {string|null} address cuenta elegida, o null para cancelar */
export function elegirCuenta(address) {
  sesion.opcionesCuenta = []
  resolverEleccion?.(address)
  resolverEleccion = null
}

/**
 * Decide con qué cuenta entrar, preguntando solo si hace falta:
 *  - sin permiso previo: conexión normal (la wallet decide si pregunta);
 *  - varias cuentas autorizadas: ventana propia para elegir;
 *  - una sola: entra directo, salvo que la persona ya haya usado 2 o más
 *    cuentas aquí, en cuyo caso se reabre el selector de la wallet.
 * @returns {Promise<string|null>}
 */
async function resolverCuenta(extension, encontrado) {
  let cuentas
  if (!(await tienePermiso(encontrado))) {
    cuentas = await solicitarCuentas(encontrado)
  } else {
    cuentas = await leerCuentas(encontrado)
    if (cuentas.length <= 1 && cuentasConocidas(extension).length > 1) {
      cuentas = await reelegirCuenta(encontrado)
    }
  }
  return cuentas.length > 1 ? pedirEleccion(cuentas) : (cuentas[0] ?? null)
}

const ETIQUETA_ROL = { admin: 'Admin', institucion: 'Institución', visitante: 'Visitante' }

/**
 * Aplica la lista de cuentas autorizadas que reporta la wallet. Se usa desde
 * el evento accountsChanged y desde la sincronización periódica.
 * @param {string[]} cuentas
 */
async function aplicarCuentas(cuentas) {
  if (cuentas.length === 0) {
    // La cuenta activa no está conectada a esta página: se pide autorizarla
    sesion.cuentaSinAutorizar = true
    return
  }
  sesion.cuentaSinAutorizar = false
  if (cuentas[0].toLowerCase() === sesion.address?.toLowerCase()) return
  sesion.address = cuentas[0]
  sesion.rol = 'visitante'
  sesion.nombreInstitucion = ''
  await refrescarTodo()
  sesion.aviso = `Cuenta cambiada: ${abreviar(sesion.address)} · ${ETIQUETA_ROL[sesion.rol]}`
}

/** @param {number} chainId */
async function aplicarRed(chainId) {
  if (chainId === sesion.chainId) return
  sesion.chainId = chainId
  sesion.rol = 'visitante'
  sesion.nombreInstitucion = ''
  await refrescarTodo()
  sesion.aviso = `Red cambiada: ${describirRed(chainId).nombre} · ${ETIQUETA_ROL[sesion.rol]}`
}

// Pali no siempre emite accountsChanged al cambiar de cuenta, así que además de
// escuchar el evento se compara con la wallet al volver a la pestaña y cada pocos segundos.
let sincronizando = false
async function sincronizar() {
  if (!proveedor || sincronizando || sesion.conectando) return
  sincronizando = true
  try {
    await aplicarCuentas((await proveedor.request({ method: 'eth_accounts' })) ?? [])
    await aplicarRed(await leerChainId(proveedor))
  } catch {
    /* la wallet puede estar bloqueada o ocupada: se reintenta en el siguiente ciclo */
  } finally {
    sincronizando = false
  }
}

let temporizador = null
const alVolver = () => document.visibilityState !== 'hidden' && sincronizar()

function suscribir() {
  quitarEscucha?.()
  quitarEscucha = escuchar(proveedor, { onCuentas: aplicarCuentas, onRed: aplicarRed })
  clearInterval(temporizador)
  temporizador = setInterval(sincronizar, 3000)
  window.addEventListener('focus', alVolver)
  document.addEventListener('visibilitychange', alVolver)
}

function dejarDeSincronizar() {
  clearInterval(temporizador)
  window.removeEventListener('focus', alVolver)
  document.removeEventListener('visibilitychange', alVolver)
}

/**
 * Abre el selector de cuentas de la wallet para elegir cuál usar en esta página.
 * Pali liga UNA cuenta a cada sitio: cambiar de cuenta dentro de la extensión no
 * cambia la cuenta que ve la DApp hasta revocar el permiso y volver a autorizar.
 */
export async function cambiarCuenta() {
  if (!proveedor) return
  sesion.error = ''
  try {
    const cuentas = await reelegirCuenta(proveedor)
    const address = cuentas.length > 1 ? await pedirEleccion(cuentas) : (cuentas[0] ?? null)
    if (address && sesion.extension) registrarCuenta(sesion.extension, address)
    await aplicarCuentas(address ? [address] : [])
  } catch (e) {
    // Si se cancela tras revocar, el sitio queda sin cuenta: se ofrece elegir de nuevo
    sesion.cuentaSinAutorizar = true
    sesion.error = traducirError(e, nombreWallet())
  }
}

/**
 * Inicia sesión con la extensión elegida.
 * @param {import('./wallet.js').Extension} extension
 * @param {boolean} [pedirPermiso] false = reconexión silenciosa
 */
export async function conectar(extension, pedirPermiso = true) {
  sesion.error = ''
  sesion.conectando = true
  try {
    const encontrado = await esperarProveedor(extension)
    if (!encontrado) {
      throw new Error(`No se detectó ${EXTENSIONES[extension].nombre}. Instálala y recarga la página.`)
    }
    sesion.extension = extension
    // Al iniciar sesión solo se pregunta qué cuenta usar cuando hay más de una;
    // la reconexión silenciosa (al recargar) solo lee la ya autorizada.
    const address = pedirPermiso
      ? await resolverCuenta(extension, encontrado)
      : await leerCuenta(encontrado, false)
    if (!address) {
      sesion.extension = null
      return false
    }
    proveedor = encontrado
    sesion.address = address
    sesion.chainId = await leerChainId(proveedor)
    suscribir()
    recordar(extension)
    registrarCuenta(extension, address)
    await refrescarTodo()
    return true
  } catch (e) {
    sesion.extension = null
    if (pedirPermiso) sesion.error = traducirError(e, EXTENSIONES[extension].nombre)
    return false
  } finally {
    sesion.conectando = false
  }
}

/** Cierra la sesión de la DApp (la extensión no tiene "logout"; se olvida la cuenta). */
export function desconectar() {
  dejarDeSincronizar()
  quitarEscucha?.()
  quitarEscucha = null
  proveedor = null
  sesion.extension = null
  sesion.address = null
  sesion.chainId = null
  sesion.saldo = '0'
  sesion.rol = 'visitante'
  sesion.nombreInstitucion = ''
  sesion.cuentaSinAutorizar = false
  sesion.aviso = ''
  recordar(null)
}

/** Al cargar la página, reconecta sin popup si la persona ya había autorizado. */
export async function restaurar() {
  let guardada = null
  try {
    guardada = localStorage.getItem(CLAVE_EXTENSION)
  } catch {
    /* sin almacenamiento */
  }
  if (guardada === 'pali' || guardada === 'metamask') await conectar(guardada, false)
}

/** Cambia la red de la wallet (la agrega si no existe). */
export async function cambiarDeRed(chainId) {
  if (!proveedor || chainId === sesion.chainId) return
  sesion.error = ''
  sesion.cambiandoRed = true
  try {
    await cambiarRed(proveedor, chainId)
    // chainChanged actualizará chainId y saldo; se fija aquí por si el evento tarda
    sesion.chainId = await leerChainId(proveedor)
    await refrescarTodo()
  } catch (e) {
    sesion.error = traducirError(e, nombreWallet())
  } finally {
    sesion.cambiandoRed = false
  }
}

export function limpiarError() {
  sesion.error = ''
}

export function limpiarAviso() {
  sesion.aviso = ''
}
