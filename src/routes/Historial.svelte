<script>
  import { formatEther } from 'ethers'
  import Tarjeta from '../components/Tarjeta.svelte'
  import Boton from '../components/Boton.svelte'
  import LoginWallet from '../components/LoginWallet.svelte'
  import { nombreMetodo } from '../lib/contrato.js'
  import { historialDe } from '../lib/explorador.js'
  import { describirRed } from '../lib/redes.js'
  import { sesion } from '../lib/sesion.svelte.js'
  import { tx } from '../lib/tx.svelte.js'
  import { abreviar, formatearFecha } from '../lib/util.js'

  const POR_PAGINA = 10

  /** @type {import('../lib/explorador.js').Movimiento[]} */
  let movimientos = $state([])
  let cargando = $state(false)
  let error = $state('')
  let pagina = $state(1)

  const red = $derived(describirRed(sesion.chainId ?? 0))
  const totalPaginas = $derived(Math.max(1, Math.ceil(movimientos.length / POR_PAGINA)))
  const visibles = $derived(movimientos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA))

  async function cargar() {
    const [chainId, direccion] = [sesion.chainId, sesion.address]
    if (!chainId || !direccion) return
    cargando = true
    error = ''
    try {
      const datos = await historialDe(chainId, direccion)
      // Descarta la respuesta si la red o la cuenta cambiaron mientras se consultaba
      if (chainId !== sesion.chainId || direccion !== sesion.address) return
      movimientos = datos
      pagina = 1
    } catch (e) {
      if (chainId !== sesion.chainId || direccion !== sesion.address) return
      movimientos = []
      error = e?.message ?? String(e)
    } finally {
      cargando = false
    }
  }

  // Se recarga al cambiar de red o de cuenta
  $effect(() => {
    void [sesion.chainId, sesion.address]
    cargar()
  })

  // ...y tras cada transacción confirmada (el explorador tarda unos segundos en indexarla)
  $effect(() => {
    if (tx.estado !== 'confirmada') return
    const t = setTimeout(cargar, 4000)
    return () => clearTimeout(t)
  })

  /** Texto del método: traducido con el ABI, no el selector de 4 bytes */
  function metodo(m) {
    if (m.interna) return 'Pago desde el contrato'
    if (m.creacion) return 'Despliegue de contrato'
    return nombreMetodo(m.input)
  }

  const esEntrada = (m) => m.hacia?.toLowerCase() === sesion.address?.toLowerCase()
</script>

{#if !sesion.address}
  <LoginWallet />
{:else}
  <Tarjeta titulo="Historial en {red.nombre}" icono="fa-clock-rotate-left">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs text-slate-400">
        Transacciones de tu cuenta en la red conectada, tomadas del explorador.
      </p>
      <Boton variante="secundario" cargando={cargando} onclick={cargar}>
        <i class="fa-solid fa-rotate"></i> Refrescar
      </Boton>
    </div>

    {#if error}
      <div class="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300" role="alert">
        <i class="fa-solid fa-circle-exclamation mr-1"></i>{error}
      </div>
    {:else if cargando && movimientos.length === 0}
      <p class="py-10 text-center text-sm text-slate-400">
        <i class="fa-solid fa-circle-notch animate-spin"></i> Consultando {red.nombre}…
      </p>
    {:else if movimientos.length === 0}
      <div class="py-10 text-center">
        <i class="fa-solid fa-inbox text-3xl text-slate-600"></i>
        <p class="mt-3 text-sm text-slate-400">Esta cuenta aún no tiene transacciones en {red.nombre}.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b border-mesh-border font-heading text-[11px] tracking-wider text-slate-400 uppercase">
              <th class="py-2 pr-4 font-semibold">Hash</th>
              <th class="py-2 pr-4 font-semibold">Método</th>
              <th class="py-2 pr-4 font-semibold">Valor</th>
              <th class="py-2 pr-4 font-semibold">Fecha</th>
              <th class="py-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody class:opacity-50={cargando}>
            {#each visibles as m (m.id)}
              <tr class="border-b border-mesh-border/50 hover:bg-mesh-cardHover/50">
                <td class="py-3 pr-4 font-mono text-xs">
                  <a
                    href={`${red.explorador}/tx/${m.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-mesh-secondary hover:underline"
                    title={m.hash}>{abreviar(m.hash, 8, 6)}</a
                  >
                </td>
                <td class="py-3 pr-4 text-slate-200">{metodo(m)}</td>
                <td class="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                  {#if m.valor > 0n}
                    <span class={esEntrada(m) ? 'text-emerald-400' : 'text-slate-200'}>
                      {esEntrada(m) ? '+' : '−'}{formatEther(m.valor)} {red.moneda.symbol}
                    </span>
                  {:else}
                    <span class="text-slate-500">0</span>
                  {/if}
                </td>
                <td class="py-3 pr-4 text-xs whitespace-nowrap text-slate-300">{formatearFecha(m.fecha)}</td>
                <td class="py-3">
                  {#if m.fallida}
                    <span class="rounded-full border border-red-500/40 bg-red-950/30 px-2 py-0.5 font-mono text-[10px] text-red-400">Fallida</span>
                  {:else}
                    <span class="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">Exitosa</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if totalPaginas > 1}
        <div class="mt-5 flex items-center justify-between gap-3 font-heading text-xs">
          <Boton variante="secundario" disabled={pagina === 1} onclick={() => (pagina -= 1)}>
            <i class="fa-solid fa-chevron-left"></i> Anterior
          </Boton>
          <span class="text-slate-400">Página {pagina} de {totalPaginas} · {movimientos.length} movimientos</span>
          <Boton variante="secundario" disabled={pagina === totalPaginas} onclick={() => (pagina += 1)}>
            Siguiente <i class="fa-solid fa-chevron-right"></i>
          </Boton>
        </div>
      {/if}
    {/if}
  </Tarjeta>
{/if}
