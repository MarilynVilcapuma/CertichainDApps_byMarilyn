<script>
  import { cerrarTx, tx } from '../lib/tx.svelte.js'
  import { urlTx } from '../lib/redes.js'
  import { abreviar } from '../lib/util.js'

  // Mapa de clases completas por estado
  const ESTADOS = {
    firma: {
      texto: 'Esperando firma en la wallet…',
      icono: 'fa-pen-nib animate-pulse',
      clases: 'border-mesh-primary/50 text-mesh-tertiary'
    },
    enviada: {
      texto: 'Transacción enviada, esperando confirmación…',
      icono: 'fa-circle-notch animate-spin',
      clases: 'border-amber-500/50 text-amber-400'
    },
    confirmada: {
      texto: 'Transacción confirmada',
      icono: 'fa-circle-check',
      clases: 'border-emerald-500/50 text-emerald-400'
    },
    error: { texto: 'La transacción falló', icono: 'fa-circle-exclamation', clases: 'border-red-500/50 text-red-400' }
  }

  const estado = $derived(tx.estado ? ESTADOS[tx.estado] : null)
  const enlace = $derived(tx.hash ? urlTx(tx.chainId, tx.hash) : null)
  const cerrable = $derived(tx.estado === 'confirmada' || tx.estado === 'error')

  // Un aviso exitoso se oculta solo; los errores quedan hasta que se cierren
  $effect(() => {
    if (tx.estado !== 'confirmada') return
    const t = setTimeout(cerrarTx, 15000)
    return () => clearTimeout(t)
  })
</script>

{#if tx.visible && estado}
  <div
    class="mesh-card fixed right-4 bottom-4 left-4 z-[60] rounded-xl border p-4 text-sm shadow-2xl sm:right-auto sm:w-96 {estado.clases}"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-start gap-3">
      <i class="fa-solid {estado.icono} mt-0.5 text-lg"></i>
      <div class="min-w-0 flex-1 space-y-1">
        <div class="font-heading font-bold text-white">{tx.titulo}</div>
        <div>{estado.texto}</div>
        {#if tx.estado === 'error' && tx.mensaje}
          <p class="text-xs text-red-300">{tx.mensaje}</p>
        {/if}
        {#if tx.hash}
          <div class="flex flex-wrap items-center gap-x-2 font-mono text-xs text-slate-300">
            <span title={tx.hash}>{abreviar(tx.hash, 10, 8)}</span>
            {#if enlace}
              <a
                href={enlace}
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-mesh-secondary underline hover:text-white"
              >
                Ver en el explorador <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            {/if}
          </div>
        {/if}
      </div>
      {#if cerrable}
        <button onclick={cerrarTx} aria-label="Cerrar aviso" class="text-slate-400 hover:text-white">
          <i class="fa-solid fa-xmark"></i>
        </button>
      {/if}
    </div>
  </div>
{/if}
