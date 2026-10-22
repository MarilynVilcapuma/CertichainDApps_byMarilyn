// ---------------------------------------------------------------
// Clientes de la API del explorador para el Historial.
//  - Etherscan API V2: una sola clave y el parámetro `chainid` sirven para
//    Sepolia, Hoodi, Ethereum, Polygon, etc.
//  - Blockscout (zkSYS, Syscoin, Rollux): misma forma de respuesta, sin clave.
// El historial se consulta SIEMPRE por red; nunca se guarda en localStorage.
// ---------------------------------------------------------------
import { obtenerRed } from './redes.js'

const CLAVE_ETHERSCAN = import.meta.env.VITE_ETHERSCAN_KEY
const REGISTROS_POR_CONSULTA = 100

/**
 * @typedef {Object} Movimiento
 * @property {string} id           único por fila (hash + tipo)
 * @property {string} hash
 * @property {string} desde
 * @property {string} hacia
 * @property {bigint} valor        en wei
 * @property {number} fecha        timestamp Unix en segundos
 * @property {boolean} fallida
 * @property {string} input        datos de la llamada (para traducir el método)
 * @property {boolean} creacion    despliegue de contrato
 * @property {boolean} interna     pago hecho por un contrato (p. ej. retirarFondos)
 */

/** @param {import('./redes.js').Red} red @param {Record<string,string>} parametros */
function construirUrl(red, parametros) {
  const consulta = new URLSearchParams({ module: 'account', ...parametros })
  if (red.apiExplorador === 'etherscan') {
    consulta.set('chainid', String(red.chainId))
    consulta.set('apikey', CLAVE_ETHERSCAN)
    return `https://api.etherscan.io/v2/api?${consulta}`
  }
  return `${red.explorador}/api?${consulta}`
}

/** Hace la consulta y devuelve la lista de resultados, o lanza un error legible. */
async function pedir(red, parametros) {
  if (red.apiExplorador === 'etherscan' && !CLAVE_ETHERSCAN) {
    throw new Error('Falta la clave del explorador. Define VITE_ETHERSCAN_KEY en el archivo .env y reinicia.')
  }
  let respuesta
  try {
    respuesta = await fetch(construirUrl(red, parametros))
  } catch {
    throw new Error(`No se pudo contactar al explorador de ${red.nombre}. Revisa tu conexión.`)
  }
  if (!respuesta.ok) throw new Error(`El explorador de ${red.nombre} respondió con error ${respuesta.status}.`)

  const datos = await respuesta.json()
  if (Array.isArray(datos.result)) return datos.result
  // "No transactions found" llega como status 0 pero no es un error
  if (/no (transactions|records) found/i.test(`${datos.message} ${datos.result}`)) return []
  throw new Error(typeof datos.result === 'string' && datos.result ? datos.result : (datos.message ?? 'Error del explorador.'))
}

/** @returns {Movimiento} */
function normalizar(fila, interna) {
  return {
    id: `${fila.hash}:${interna ? 'interna' : 'normal'}:${fila.traceId ?? ''}`,
    hash: fila.hash,
    desde: fila.from,
    hacia: fila.to,
    valor: BigInt(fila.value || '0'),
    fecha: Number(fila.timeStamp),
    fallida: fila.isError === '1',
    input: interna ? '0x' : (fila.input ?? '0x'),
    creacion: Boolean(fila.contractAddress) && !fila.to,
    interna
  }
}

/**
 * Transacciones de una cuenta en una red: normales + internas (los pagos que
 * salen de un contrato, como `retirarFondos`), de la más reciente a la más antigua.
 * @param {number} chainId
 * @param {string} direccion
 * @returns {Promise<Movimiento[]>}
 */
export async function historialDe(chainId, direccion) {
  const red = obtenerRed(chainId)
  if (!red) throw new Error('Esta red no está soportada por la DApp.')

  const comunes = {
    address: direccion,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: String(REGISTROS_POR_CONSULTA),
    sort: 'desc'
  }
  // Se piden en secuencia: el plan gratuito limita las consultas por segundo
  const normales = await pedir(red, { action: 'txlist', ...comunes })
  let internas = []
  try {
    internas = await pedir(red, { action: 'txlistinternal', ...comunes })
  } catch {
    // Las internas son un complemento: si fallan se muestra al menos el resto
  }

  return [...normales.map((f) => normalizar(f, false)), ...internas.map((f) => normalizar(f, true))].sort(
    (a, b) => b.fecha - a.fecha
  )
}
