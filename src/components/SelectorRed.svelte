<script>
  import { LISTA_REDES, describirRed, obtenerRed } from '../lib/redes.js'
  import { cambiarDeRed, sesion } from '../lib/sesion.svelte.js'

  const red = $derived(sesion.chainId ? describirRed(sesion.chainId) : null)
  const desconocida = $derived(sesion.chainId !== null && !obtenerRed(sesion.chainId))
</script>

<div class="relative">
  <label for="selector-red" class="sr-only">Red</label>
  <span
    class="pointer-events-none absolute top-1/2 left-3 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
    style:background-color={red?.color ?? '#64748b'}
  ></span>
  <select
    id="selector-red"
    value={sesion.chainId ?? ''}
    disabled={!sesion.address || sesion.cambiandoRed}
    title={sesion.address ? 'Cambiar de red' : 'Conecta tu wallet para cambiar de red'}
    onchange={(e) => cambiarDeRed(Number(e.currentTarget.value))}
    class="w-44 appearance-none rounded-xl border border-mesh-border bg-mesh-input py-2.5 pr-8 pl-8 font-heading text-xs font-semibold text-white focus:border-mesh-secondary focus:outline-none disabled:opacity-60"
  >
    {#if !sesion.address}
      <option value="">Sin conexión</option>
    {/if}
    {#if desconocida}
      <option value={sesion.chainId}>{red?.nombre}</option>
    {/if}
    {#each LISTA_REDES as r (r.chainId)}
      <option value={r.chainId}>{r.nombre}</option>
    {/each}
  </select>
  <i
    class="fa-solid {sesion.cambiandoRed
      ? 'fa-circle-notch animate-spin'
      : 'fa-chevron-down'} pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-slate-400"
  ></i>
</div>
