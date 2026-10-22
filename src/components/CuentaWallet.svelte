<script>
  import Boton from './Boton.svelte'
  import RolBadge from './RolBadge.svelte'
  import { describirRed } from '../lib/redes.js'
  import { cambiarCuenta, desconectar, sesion } from '../lib/sesion.svelte.js'
  import { abreviar, formatearSaldo } from '../lib/util.js'

  let menu = $state(false)
  let copiado = $state(false)

  const simbolo = $derived(sesion.chainId ? describirRed(sesion.chainId).moneda.symbol : 'ETH')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(sesion.address ?? '')
      copiado = true
      setTimeout(() => (copiado = false), 1500)
    } catch {
      /* portapapeles no disponible */
    }
  }
</script>

<svelte:window onclick={() => (menu = false)} />

<div class="relative">
  <button
    onclick={(e) => {
      e.stopPropagation()
      menu = !menu
    }}
    aria-expanded={menu}
    class="flex items-center gap-2 rounded-xl border border-mesh-primary/40 bg-mesh-card px-3 py-2 font-heading text-xs font-semibold text-white transition-all hover:border-mesh-secondary"
  >
    <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
    <span class="font-mono">{abreviar(sesion.address)}</span>
    <span class="hidden text-mesh-secondary sm:inline">{formatearSaldo(sesion.saldo)} {simbolo}</span>
    <RolBadge />
    <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
  </button>

  {#if menu}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      onclick={(e) => e.stopPropagation()}
      class="mesh-card absolute right-0 mt-2 w-64 space-y-3 rounded-xl p-4 text-xs"
    >
      <div>
        <div class="font-heading tracking-wider text-slate-400 uppercase">Saldo</div>
        <div class="font-mono text-base text-white">{formatearSaldo(sesion.saldo, 6)} {simbolo}</div>
      </div>
      {#if sesion.nombreInstitucion}
        <div class="font-heading text-sm font-semibold text-white">{sesion.nombreInstitucion}</div>
      {/if}
      <button
        onclick={copiar}
        class="w-full break-all rounded-lg bg-mesh-input p-2 text-left font-mono text-[11px] text-mesh-secondary hover:bg-slate-800"
        title="Copiar dirección"
      >
        {sesion.address}
        <span class="ml-1 text-slate-400">{copiado ? '¡Copiada!' : ''}</span>
      </button>
      <Boton
        variante="secundario"
        class="w-full"
        onclick={() => {
          menu = false
          cambiarCuenta()
        }}
      >
        <i class="fa-solid fa-right-left"></i> Cambiar de cuenta
      </Boton>
      <Boton variante="texto" class="w-full" onclick={desconectar}>Cerrar sesión</Boton>
    </div>
  {/if}
</div>
