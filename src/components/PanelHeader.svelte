<script>
  import SelectorRed from './SelectorRed.svelte'
  import CuentaWallet from './CuentaWallet.svelte'
  import { sesion } from '../lib/sesion.svelte.js'

  // Mapa de clases completas: título del panel según el rol
  const TITULOS = {
    admin: 'Panel de administración',
    institucion: 'Panel de la institución',
    visitante: 'Panel de wallet'
  }
</script>

<header class="mesh-card sticky top-0 z-50 border-b border-mesh-border">
  <div class="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <a
      href="#/"
      class="flex items-center gap-2 font-heading text-sm font-medium text-slate-300 transition-colors hover:text-mesh-secondary"
    >
      <i class="fa-solid fa-arrow-left"></i>
      <span class="hidden sm:inline">Volver a CertiChain Perú</span>
    </a>

    <div class="hidden text-center md:block">
      <span class="flex items-center justify-center gap-2 font-heading text-sm font-bold text-white">
        <i class="fa-solid fa-wallet text-mesh-secondary"></i>
        {TITULOS[sesion.rol]}
      </span>
      <span class="block font-mono text-[10px] tracking-widest text-mesh-tertiary uppercase">
        Proyecto SID · CertiChain Perú
      </span>
    </div>

    <div class="flex items-center gap-3">
      <SelectorRed />
      {#if sesion.address}<CuentaWallet />{/if}
    </div>
  </div>
</header>
