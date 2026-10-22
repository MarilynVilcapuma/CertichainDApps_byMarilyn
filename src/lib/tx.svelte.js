// ---------------------------------------------------------------
// Ciclo de vida de una transacción, compartido por TODAS las pantallas
// (enviar, registrar, emitir, revocar, retirar, tarifa...).
// Estados: firma → enviada → confirmada | error.
// ---------------------------------------------------------------
import { mensajeErrorContrato } from './contrato.js'
import { refrescarTodo, sesion } from './sesion.svelte.js'

export const tx = $state({
  visible: false,
  /** @type {'firma'|'enviada'|'confirmada'|'error'|''} */
  estado: '',
  titulo: '',
  hash: '',
  chainId: /** @type {number|null} */ (null),
  mensaje: ''
})

export function cerrarTx() {
  tx.visible = false
}

/**
 * Ejecuta una transacción mostrando el aviso con hash y enlace al explorador.
 * `enviar` debe devolver la respuesta de ethers (TransactionResponse).
 * Devuelve el recibo si se confirmó, o null si falló o se rechazó.
 * @param {string} titulo ej. "Registrar institución"
 * @param {() => Promise<import('ethers').TransactionResponse>} enviar
 */
export async function ejecutarTx(titulo, enviar) {
  Object.assign(tx, {
    visible: true,
    estado: 'firma',
    titulo,
    hash: '',
    chainId: sesion.chainId,
    mensaje: ''
  })
  try {
    const respuesta = await enviar()
    tx.hash = respuesta.hash
    tx.estado = 'enviada'
    const recibo = await respuesta.wait()
    if (recibo?.status === 0) throw Object.assign(new Error('revertida'), { code: 'CALL_EXCEPTION' })
    tx.estado = 'confirmada'
    await refrescarTodo()
    return recibo
  } catch (e) {
    tx.estado = 'error'
    tx.mensaje =
      e?.code === 'CALL_EXCEPTION' && tx.hash && !e?.revert
        ? 'La transacción fue revertida por la red.'
        : mensajeErrorContrato(e)
    // Aunque falle, el saldo pudo cambiar por el gas gastado
    if (tx.hash) await refrescarTodo()
    return null
  }
}
