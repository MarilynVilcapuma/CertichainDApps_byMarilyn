/** Abrevia una dirección o hash: 0x1234…abcd */
export function abreviar(valor, inicio = 6, fin = 4) {
  if (!valor || valor.length <= inicio + fin + 1) return valor ?? ''
  return `${valor.slice(0, inicio)}…${valor.slice(-fin)}`
}

/** Convierte un timestamp Unix (segundos) a fecha legible en español. */
export function formatearFecha(segundos) {
  return new Date(Number(segundos) * 1000).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

/** Recorta decimales de un saldo en ether (string) para mostrarlo. */
export function formatearSaldo(ether, decimales = 4) {
  const n = Number(ether)
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: decimales }) : '0'
}

/** ¿Es un bytes32 válido (con o sin prefijo 0x)? Devuelve el valor normalizado con 0x, o null. */
export function normalizarCodigo(texto) {
  const limpio = (texto ?? '').trim()
  const hex = limpio.startsWith('0x') || limpio.startsWith('0X') ? limpio.slice(2) : limpio
  return /^[0-9a-fA-F]{64}$/.test(hex) ? `0x${hex.toLowerCase()}` : null
}
