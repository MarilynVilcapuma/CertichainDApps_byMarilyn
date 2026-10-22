<script>
  /** @type {{ abierto: boolean, titulo: string, onCerrar: () => void, children: import('svelte').Snippet }} */
  let { abierto, titulo, onCerrar, children } = $props()
</script>

<svelte:window onkeydown={(e) => abierto && e.key === 'Escape' && onCerrar()} />

{#if abierto}
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <button
      class="absolute inset-0 cursor-default bg-black/70"
      aria-label="Cerrar"
      onclick={onCerrar}
      tabindex="-1"
    ></button>
    <div
      class="mesh-card relative w-full max-w-md space-y-4 rounded-2xl border border-mesh-primary/40 p-6 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <h3 class="font-heading text-lg font-bold text-white">{titulo}</h3>
      {@render children()}
    </div>
  </div>
{/if}
