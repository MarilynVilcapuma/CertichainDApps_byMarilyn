<script>
  /** @type {{ etiqueta: string, valor?: string, tipo?: string, placeholder?: string, ayuda?: string, error?: string, mono?: boolean, id?: string }} */
  let {
    etiqueta,
    valor = $bindable(''),
    tipo = 'text',
    placeholder = '',
    ayuda = '',
    error = '',
    mono = false,
    id = `campo-${crypto.randomUUID().slice(0, 8)}`
  } = $props()
</script>

<div class="flex flex-col gap-1.5">
  <label for={id} class="font-heading text-xs font-semibold tracking-wider text-slate-300 uppercase"
    >{etiqueta}</label
  >
  <input
    {id}
    type={tipo}
    {placeholder}
    bind:value={valor}
    aria-invalid={error ? 'true' : undefined}
    class="w-full rounded-xl border bg-mesh-input px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-mesh-secondary focus:ring-1 focus:ring-mesh-secondary focus:outline-none {error
      ? 'border-red-500'
      : 'border-mesh-border'} {mono ? 'font-mono text-xs' : ''}"
  />
  {#if error}
    <p class="text-xs text-red-400">{error}</p>
  {:else if ayuda}
    <p class="text-xs text-slate-400">{ayuda}</p>
  {/if}
</div>
