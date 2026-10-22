<script>
  /** @type {{ titulo?: string, icono?: string, class?: string, children: import('svelte').Snippet }} */
  let { titulo = '', icono = '', class: extra = '', children } = $props()
</script>

<div class="mesh-card rounded-2xl border border-mesh-border p-6 shadow-2xl sm:p-8 {extra}">
  {#if titulo}
    <h2 class="mb-4 flex items-center gap-2 font-heading text-lg font-bold text-white">
      {#if icono}<i class="fa-solid {icono} text-mesh-secondary" aria-hidden="true"></i>{/if}
      {titulo}
    </h2>
  {/if}
  {@render children()}
</div>
