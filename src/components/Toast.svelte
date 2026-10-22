<script>
  import { limpiarAviso, limpiarError, sesion } from '../lib/sesion.svelte.js'

  // Los errores globales de la wallet se ocultan solos
  $effect(() => {
    if (!sesion.error) return
    const t = setTimeout(limpiarError, 6000)
    return () => clearTimeout(t)
  })

  // Los avisos informativos (cambio de cuenta o de red) también se ocultan solos
  $effect(() => {
    if (!sesion.aviso) return
    const t = setTimeout(limpiarAviso, 5000)
    return () => clearTimeout(t)
  })
</script>

{#if sesion.aviso}
  <div
    class="fixed top-24 right-4 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-mesh-secondary/40 bg-mesh-card p-4 text-sm text-slate-100 shadow-2xl"
    role="status"
  >
    <i class="fa-solid fa-circle-info mt-0.5 text-mesh-secondary"></i>
    <p class="flex-1">{sesion.aviso}</p>
    <button onclick={limpiarAviso} aria-label="Cerrar aviso" class="text-slate-400 hover:text-white">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
{/if}

{#if sesion.error}
  <div
    class="fixed top-44 right-4 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/90 p-4 text-sm text-red-200 shadow-2xl"
    role="alert"
  >
    <i class="fa-solid fa-circle-exclamation mt-0.5 text-red-400"></i>
    <p class="flex-1">{sesion.error}</p>
    <button onclick={limpiarError} aria-label="Cerrar aviso" class="text-red-300 hover:text-white">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
{/if}
