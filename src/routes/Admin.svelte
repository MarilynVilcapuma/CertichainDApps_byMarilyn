<script>
  import { formatEther, isAddress, parseEther } from 'ethers'
  import Tarjeta from '../components/Tarjeta.svelte'
  import Campo from '../components/Campo.svelte'
  import Boton from '../components/Boton.svelte'
  import AvisoSinContrato from '../components/AvisoSinContrato.svelte'
  import { contratoConWallet, mensajeErrorContrato } from '../lib/contrato.js'
  import { describirRed } from '../lib/redes.js'
  import { contratoActual, proveedorActivo, sesion } from '../lib/sesion.svelte.js'
  import { ejecutarTx, tx } from '../lib/tx.svelte.js'

  const red = $derived(describirRed(sesion.chainId ?? 0))
  const contratoFirmante = () => contratoConWallet(proveedorActivo(), /** @type {number} */ (sesion.chainId), true)

  // ---------------- Lectura: balance y tarifa ----------------
  /** @type {bigint|null} */
  let balance = $state(null)
  /** @type {bigint|null} */
  let tarifa = $state(null)
  let errorLectura = $state('')

  $effect(() => {
    // Se relee al cambiar de red o de cuenta, y tras cada transacción confirmada
    void [sesion.chainId, sesion.address, tx.estado === 'confirmada']
    if (!contratoActual() || !proveedorActivo()) return
    contratoConWallet(proveedorActivo(), /** @type {number} */ (sesion.chainId))
      .then((c) => Promise.all([c.balanceContrato(), c.tarifaRegistro()]))
      .then(([b, t]) => {
        balance = b
        tarifa = t
        errorLectura = ''
      })
      .catch((e) => (errorLectura = mensajeErrorContrato(e)))
  })

  // ---------------- Retirar fondos ----------------
  async function retirar() {
    const contrato = await contratoFirmante()
    if (contrato) await ejecutarTx('Retirar fondos', () => contrato.retirarFondos())
  }

  // ---------------- Tarifa ----------------
  let nuevaTarifa = $state('')
  const tarifaWei = $derived.by(() => {
    try {
      const v = parseEther(nuevaTarifa.trim())
      return v >= 0n ? v : null
    } catch {
      return null
    }
  })

  async function cambiarTarifa(evento) {
    evento.preventDefault()
    if (tarifaWei === null) return
    const contrato = await contratoFirmante()
    if (!contrato) return
    const recibo = await ejecutarTx('Cambiar tarifa', () => contrato.setTarifa(tarifaWei))
    if (recibo) nuevaTarifa = ''
  }

  // ---------------- Instituciones ----------------
  let direccion = $state('')
  /** @type {null | { nombre: string, habilitada: boolean }} */
  let institucion = $state(null)
  let errorInstitucion = $state('')
  let buscando = $state(false)

  const direccionValida = $derived(isAddress(direccion.trim()))

  async function buscarInstitucion(evento) {
    evento?.preventDefault()
    institucion = null
    errorInstitucion = ''
    if (!direccionValida) {
      errorInstitucion = 'La dirección no es válida.'
      return
    }
    buscando = true
    try {
      const c = await contratoConWallet(proveedorActivo(), /** @type {number} */ (sesion.chainId))
      const [nombre, habilitada] = await Promise.all([
        c.nombreInstitucion(direccion.trim()),
        c.emisores(direccion.trim())
      ])
      if (!nombre) errorInstitucion = 'Esa dirección no se ha registrado como institución.'
      else institucion = { nombre, habilitada }
    } catch (e) {
      errorInstitucion = mensajeErrorContrato(e)
    } finally {
      buscando = false
    }
  }

  async function fijarEmisor(autorizado) {
    const contrato = await contratoFirmante()
    if (!contrato || !institucion) return
    const recibo = await ejecutarTx(
      autorizado ? 'Activar institución' : 'Desactivar institución',
      () => contrato.setEmisor(direccion.trim(), autorizado)
    )
    if (recibo) await buscarInstitucion()
  }

  const ocupado = $derived(tx.estado === 'firma' || tx.estado === 'enviada')
</script>

{#if !contratoActual()}
  <AvisoSinContrato />
{:else if sesion.rol !== 'admin'}
  <Tarjeta titulo="Acceso restringido" icono="fa-lock">
    <p class="text-sm text-slate-400">Este módulo es solo para el administrador de CertiChain en {red.nombre}.</p>
  </Tarjeta>
{:else}
  <div class="space-y-6">
    {#if errorLectura}
      <p class="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{errorLectura}</p>
    {/if}

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recaudación -->
      <Tarjeta titulo="Fondos recaudados" icono="fa-vault">
        <div class="space-y-4">
          <p class="font-heading text-3xl font-bold text-white sm:text-4xl">
            {balance === null ? '—' : formatEther(balance)}
            <span class="font-mono text-sm font-normal text-slate-400">{red.moneda.symbol}</span>
          </p>
          <p class="text-xs text-slate-400">
            Cada institución que se registra paga la tarifa y el monto se acumula en el contrato de {red.nombre}.
            Al retirar, todo el saldo pasa a tu cuenta de admin.
          </p>
          <Boton class="w-full" onclick={retirar} disabled={ocupado || balance === null || balance === 0n}>
            <i class="fa-solid fa-money-bill-transfer"></i>
            Retirar {balance ? `${formatEther(balance)} ${red.moneda.symbol}` : 'fondos'}
          </Boton>
          {#if balance === 0n}
            <p class="text-xs text-amber-400">
              <i class="fa-solid fa-circle-info"></i> Aún no hay fondos que retirar: se acumulan cuando una institución
              se registra pagando la tarifa.
            </p>
          {/if}
        </div>
      </Tarjeta>

      <!-- Tarifa -->
      <Tarjeta titulo="Tarifa de registro" icono="fa-tag">
        <form onsubmit={cambiarTarifa} class="space-y-4">
          <p class="text-sm text-slate-400">
            Vigente:
            <span class="font-mono font-semibold text-mesh-secondary">
              {tarifa === null ? '—' : formatEther(tarifa)} {red.moneda.symbol}
            </span>
          </p>
          <Campo
            etiqueta="Nueva tarifa ({red.moneda.symbol})"
            bind:valor={nuevaTarifa}
            placeholder="0.001"
            error={nuevaTarifa && tarifaWei === null ? 'Monto no válido.' : ''}
          />
          <Boton tipo="submit" class="w-full" disabled={ocupado || tarifaWei === null}>Cambiar tarifa</Boton>
        </form>
      </Tarjeta>
    </div>

    <!-- Instituciones -->
    <Tarjeta titulo="Instituciones" icono="fa-building-columns">
      <form onsubmit={buscarInstitucion} class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="flex-1">
          <Campo etiqueta="Dirección de la institución" bind:valor={direccion} placeholder="0x…" mono />
        </div>
        <Boton tipo="submit" variante="secundario" cargando={buscando} disabled={!direccion.trim()}>Buscar</Boton>
      </form>
      {#if errorInstitucion}
        <p class="mt-3 text-sm text-red-400" role="alert">{errorInstitucion}</p>
      {/if}
      {#if institucion}
        <div class="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-mesh-border bg-mesh-input p-4">
          <div>
            <p class="font-heading font-semibold text-white">{institucion.nombre}</p>
            <p class="text-xs {institucion.habilitada ? 'text-emerald-400' : 'text-red-400'}">
              {institucion.habilitada ? 'Habilitada para emitir' : 'Desactivada'}
            </p>
          </div>
          {#if institucion.habilitada}
            <Boton variante="peligro" onclick={() => fijarEmisor(false)} disabled={ocupado}>Desactivar</Boton>
          {:else}
            <Boton variante="cian" onclick={() => fijarEmisor(true)} disabled={ocupado}>Activar</Boton>
          {/if}
        </div>
      {/if}
    </Tarjeta>
  </div>
{/if}
