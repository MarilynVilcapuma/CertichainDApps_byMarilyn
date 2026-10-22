<script>
  /** @type {{ variante?: 'primario'|'secundario'|'cian'|'peligro'|'texto', tipo?: 'button'|'submit', cargando?: boolean, disabled?: boolean, onclick?: (e: MouseEvent) => void, class?: string, children: import('svelte').Snippet }} */
  let {
    variante = 'primario',
    tipo = 'button',
    cargando = false,
    disabled = false,
    onclick,
    class: extra = '',
    children
  } = $props()

  // Mapa de clases completas (Tailwind no detecta nombres armados por concatenación)
  const VARIANTES = {
    primario:
      'bg-gradient-to-r from-mesh-primary to-mesh-secondary text-slate-950 shadow-lg shadow-mesh-primary/30 hover:opacity-95',
    cian: 'bg-mesh-secondary text-slate-950 shadow-lg shadow-mesh-secondary/20 hover:bg-mesh-secondaryHover',
    secundario:
      'bg-mesh-card text-white border border-mesh-primary/40 hover:bg-mesh-cardHover hover:border-mesh-secondary',
    peligro: 'bg-red-600 text-white hover:bg-red-500',
    texto: 'bg-transparent text-slate-300 hover:text-mesh-secondary'
  }
</script>

<button
  type={tipo}
  {onclick}
  disabled={disabled || cargando}
  class="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-heading text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 {VARIANTES[
    variante
  ]} {extra}"
>
  {#if cargando}
    <i class="fa-solid fa-circle-notch animate-spin" aria-hidden="true"></i>
  {/if}
  {@render children()}
</button>
