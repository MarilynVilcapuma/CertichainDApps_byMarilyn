<script>
  import Tarjeta from './Tarjeta.svelte'
  import Boton from './Boton.svelte'
  import { EXTENSIONES, obtenerProveedor } from '../lib/wallet.js'
  import { conectar, sesion } from '../lib/sesion.svelte.js'

  const OPCIONES = /** @type {const} */ (['pali', 'metamask'])

  // Se evalúa al pintar y al terminar de conectar; las extensiones se anuncian con retraso
  let instaladas = $state({ pali: true, metamask: true })
  $effect(() => {
    const revisar = () => {
      for (const ext of OPCIONES) instaladas[ext] = obtenerProveedor(ext) !== null
    }
    revisar()
    const t = setTimeout(revisar, 600)
    return () => clearTimeout(t)
  })
</script>

<div class="mx-auto max-w-md">
  <Tarjeta titulo="Inicia sesión con tu wallet" icono="fa-wallet">
    <p class="mb-5 text-sm text-slate-400">Esta pantalla necesita tu wallet para firmar.</p>
    <div class="flex flex-col gap-3">
      {#each OPCIONES as ext (ext)}
        {@const e = EXTENSIONES[ext]}
        {#if instaladas[ext]}
          <Boton
            variante={ext === 'pali' ? 'primario' : 'secundario'}
            cargando={sesion.conectando && sesion.extension === ext}
            disabled={sesion.conectando}
            onclick={() => conectar(ext)}
          >
            {e.nombre}
          </Boton>
        {:else}
          <a
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 rounded-xl border border-dashed border-mesh-border px-5 py-3 font-heading text-sm font-semibold text-slate-300 transition-colors hover:border-mesh-secondary hover:text-mesh-secondary"
          >
            <i class="fa-solid fa-download"></i> Instalar {e.nombre}
          </a>
        {/if}
      {/each}
    </div>
    {#if sesion.error}
      <p class="mt-4 text-sm text-red-400" role="alert">{sesion.error}</p>
    {/if}
  </Tarjeta>
</div>
