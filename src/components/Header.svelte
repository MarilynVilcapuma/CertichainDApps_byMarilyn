<script>
  import Logo from './Logo.svelte'
  import CuentaWallet from './CuentaWallet.svelte'
  import { sesion } from '../lib/sesion.svelte.js'

  /** @type {{ ruta: string }} */
  let { ruta } = $props()

  let menuAbierto = $state(false)

  // El sitio público solo tiene Inicio y Verificar; todo lo que requiere wallet vive en el panel
  const ENLACES = [
    { ruta: '/', texto: 'Inicio' },
    { ruta: '/verificar', texto: 'Verificar' }
  ]
</script>

{#snippet cuenta()}
  {#if sesion.address}
    <a
      href="#/panel"
      class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-mesh-primary to-mesh-secondary px-4 py-2.5 font-heading text-xs font-bold text-slate-950 shadow-lg shadow-mesh-primary/30 transition-opacity hover:opacity-95"
    >
      <i class="fa-solid fa-gauge"></i> Mi panel
    </a>
    <CuentaWallet />
  {:else}
    <a
      href="#/conectar"
      class="flex items-center gap-2 rounded-xl border border-mesh-primary/40 bg-mesh-card px-4 py-2.5 font-heading text-xs font-semibold text-white transition-all hover:border-mesh-secondary"
    >
      <i class="fa-solid fa-wallet text-mesh-secondary"></i> Conectar wallet
    </a>
  {/if}
{/snippet}

<header class="mesh-card sticky top-0 z-50 border-b border-mesh-border">
  <div class="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <a href="#/" class="flex shrink-0 items-center gap-3.5">
      <Logo id="hexGradientHeader" />
      <div>
        <span class="font-heading text-xl font-bold tracking-tight text-white">
          CertiChain <span class="text-mesh-secondary">Perú</span>
        </span>
        <span class="block font-mono text-[10px] font-semibold tracking-widest text-mesh-tertiary uppercase">
          Proyecto SID · Innovación Blockchain
        </span>
      </div>
    </a>

    <nav class="hidden items-center gap-6 font-heading text-sm font-medium md:flex" aria-label="Principal">
      {#each ENLACES as e (e.ruta)}
        <a
          href={`#${e.ruta}`}
          aria-current={ruta === e.ruta ? 'page' : undefined}
          class="transition-colors hover:text-mesh-secondary {ruta === e.ruta
            ? 'text-mesh-secondary'
            : 'text-slate-300'}">{e.texto}</a
        >
      {/each}
    </nav>

    <div class="hidden shrink-0 items-center gap-3 md:flex">
      {@render cuenta()}
    </div>

    <button
      onclick={() => (menuAbierto = !menuAbierto)}
      class="p-2 text-slate-300 hover:text-white md:hidden"
      aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={menuAbierto}
    >
      <i class="fa-solid {menuAbierto ? 'fa-xmark' : 'fa-bars'} text-xl"></i>
    </button>
  </div>

  {#if menuAbierto}
    <div class="mesh-card space-y-1 border-t border-mesh-border px-5 pt-3 pb-6 font-heading md:hidden">
      {#each ENLACES as e (e.ruta)}
        <a
          href={`#${e.ruta}`}
          onclick={() => (menuAbierto = false)}
          class="block py-2 font-medium hover:text-mesh-secondary {ruta === e.ruta
            ? 'text-mesh-secondary'
            : 'text-slate-300'}">{e.texto}</a
        >
      {/each}
      <div class="flex flex-wrap items-center gap-3 pt-3">
        {@render cuenta()}
      </div>
    </div>
  {/if}
</header>
