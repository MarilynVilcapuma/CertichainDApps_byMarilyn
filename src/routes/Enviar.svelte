<script>
  import { formatEther, isAddress, parseEther } from 'ethers'
  import Tarjeta from '../components/Tarjeta.svelte'
  import Campo from '../components/Campo.svelte'
  import Boton from '../components/Boton.svelte'
  import LoginWallet from '../components/LoginWallet.svelte'
  import { describirRed } from '../lib/redes.js'
  import { obtenerSigner, sesion } from '../lib/sesion.svelte.js'
  import { ejecutarTx } from '../lib/tx.svelte.js'
  import { formatearSaldo } from '../lib/util.js'

  let destino = $state('')
  let monto = $state('')
  let enviando = $state(false)
  /** Error real devuelto por la wallet o la red al estimar el gas */
  let errorEnvio = $state('')

  const red = $derived(describirRed(sesion.chainId ?? 0))

  const errorDestino = $derived.by(() => {
    if (!destino) return ''
    if (!isAddress(destino.trim())) return 'La dirección no es válida.'
    if (destino.trim().toLowerCase() === sesion.address?.toLowerCase()) return 'Es tu propia dirección.'
    return ''
  })

  /** @returns {bigint|null} wei, o null si el monto no es válido */
  const montoWei = $derived.by(() => {
    try {
      const v = parseEther(monto.trim())
      return v > 0n ? v : null
    } catch {
      return null
    }
  })

  const errorMonto = $derived.by(() => {
    if (!monto) return ''
    if (montoWei === null) return 'Ingresa un monto mayor a 0.'
    if (montoWei > parseEther(sesion.saldo || '0')) return 'Saldo insuficiente.'
    return ''
  })

  const valido = $derived(
    Boolean(destino) && !errorDestino && montoWei !== null && !errorMonto && !enviando
  )

  async function enviar(evento) {
    evento.preventDefault()
    if (!valido || montoWei === null) return
    errorEnvio = ''
    enviando = true
    try {
      const signer = await obtenerSigner()
      const para = destino.trim()

      // Se estima el gas antes de pedir la firma: si la red lo rechazaría,
      // se muestra aquí el error real en vez de gastar gas en una tx fallida.
      let gasLimit
      try {
        gasLimit = await signer.estimateGas({ to: para, value: montoWei })
      } catch (e) {
        errorEnvio = e?.info?.error?.message ?? e?.shortMessage ?? e?.message ?? String(e)
        return
      }

      const recibo = await ejecutarTx('Enviar ' + red.moneda.symbol, () =>
        signer.sendTransaction({ to: para, value: montoWei, gasLimit })
      )
      if (recibo) {
        destino = ''
        monto = ''
      }
    } catch (e) {
      errorEnvio = e?.info?.error?.message ?? e?.shortMessage ?? e?.message ?? String(e)
    } finally {
      enviando = false
    }
  }
</script>

{#if !sesion.address}
  <LoginWallet />
{:else}
  <div class="mx-auto max-w-xl">
    <Tarjeta titulo="Enviar {red.moneda.symbol}" icono="fa-paper-plane">
      <form onsubmit={enviar} class="space-y-5">
        <Campo
          etiqueta="Dirección de destino"
          bind:valor={destino}
          placeholder="0x…"
          mono
          error={errorDestino}
        />
        <div class="space-y-1.5">
          <Campo
            etiqueta="Monto ({red.moneda.symbol})"
            bind:valor={monto}
            tipo="text"
            placeholder="0.0"
            error={errorMonto}
          />
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>
              Disponible:
              <span class="font-mono text-mesh-secondary">
                {formatearSaldo(sesion.saldo, 6)} {red.moneda.symbol}
              </span>
              · {red.nombre}
            </span>
            <button
              type="button"
              class="font-semibold text-mesh-tertiary hover:text-mesh-secondary"
              onclick={() => (monto = formatEther(parseEther(sesion.saldo || '0')))}
            >
              Máx.
            </button>
          </div>
        </div>

        {#if errorEnvio}
          <div class="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300" role="alert">
            <strong class="font-heading">No se pudo enviar:</strong>
            <span class="break-words">{errorEnvio}</span>
          </div>
        {/if}

        <Boton tipo="submit" class="w-full" cargando={enviando} disabled={!valido}>
          <i class="fa-solid fa-paper-plane"></i> Enviar
        </Boton>
      </form>
    </Tarjeta>
  </div>
{/if}
