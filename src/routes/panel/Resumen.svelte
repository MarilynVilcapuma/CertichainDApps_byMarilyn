<script>
  import Tarjeta from '../../components/Tarjeta.svelte'
  import RolBadge from '../../components/RolBadge.svelte'
  import AvisoSinContrato from '../../components/AvisoSinContrato.svelte'
  import { describirRed } from '../../lib/redes.js'
  import { contratoActual, refrescarTodo, sesion } from '../../lib/sesion.svelte.js'
  import { formatearSaldo } from '../../lib/util.js'

  let copiado = $state(false)
  let actualizando = $state(false)

  const red = $derived(describirRed(sesion.chainId ?? 0))

  async function copiar() {
    try {
      await navigator.clipboard.writeText(sesion.address ?? '')
      copiado = true
      setTimeout(() => (copiado = false), 1500)
    } catch {
      /* portapapeles no disponible */
    }
  }

  async function actualizar() {
    actualizando = true
    await refrescarTodo()
    actualizando = false
  }

  // Qué hace cada rol en el panel
  const DESCRIPCION_ROL = {
    admin: 'Cobras lo recaudado, activas o desactivas instituciones y cambias la tarifa.',
    institucion: 'Emites y revocas certificados. Ya no necesitas volver a pagar la tarifa.',
    visitante: 'Registra tu institución pagando la tarifa para poder emitir certificados.'
  }
</script>

<div class="space-y-6">
  {#if !contratoActual()}<AvisoSinContrato />{/if}

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Cuenta -->
    <Tarjeta titulo="Cuenta" icono="fa-user">
      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <RolBadge />
          {#if sesion.nombreInstitucion}
            <span class="font-heading text-sm font-semibold text-white">{sesion.nombreInstitucion}</span>
          {/if}
        </div>
        <p class="text-sm text-slate-400">{DESCRIPCION_ROL[sesion.rol]}</p>
        <p class="rounded-xl border border-mesh-border bg-mesh-input px-3.5 py-3 font-mono text-xs break-all text-slate-300">
          {sesion.address}
        </p>
        <div class="flex flex-wrap gap-2 font-heading text-xs font-semibold">
          <button
            onclick={copiar}
            class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-mesh-primary/80 px-3.5 py-2.5 text-white transition-colors hover:bg-mesh-primary"
          >
            <i class="fa-solid {copiado ? 'fa-check' : 'fa-copy'}"></i>
            {copiado ? '¡Copiado!' : 'Copiar dirección'}
          </button>
          {#if red.explorador}
            <a
              href={`${red.explorador}/address/${sesion.address}`}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-mesh-border px-3.5 py-2.5 text-slate-300 transition-colors hover:border-mesh-secondary hover:text-mesh-secondary"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver en el explorador
            </a>
          {/if}
        </div>
      </div>
    </Tarjeta>

    <!-- Saldo y red -->
    <Tarjeta titulo="Saldo y red" icono="fa-wallet">
      <div class="space-y-4">
        <p class="font-heading text-3xl font-bold text-white sm:text-4xl">
          {formatearSaldo(sesion.saldo, 6)}
          <span class="font-mono text-sm font-normal text-slate-400">{red.moneda.symbol}</span>
        </p>
        <div class="flex items-center gap-3">
          <span class="h-3 w-3 shrink-0 rounded-full" style:background-color={red.color}></span>
          <div>
            <p class="font-heading text-sm font-semibold text-white">{red.nombre}</p>
            <p class="font-mono text-[11px] text-slate-500">
              Chain ID {sesion.chainId} · {red.tipo} · {red.moneda.symbol}
            </p>
          </div>
        </div>
        {#if contratoActual()}
          <p class="font-mono text-[11px] break-all text-slate-500">
            Contrato:
            <a
              href={`${red.explorador}/address/${contratoActual()}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-mesh-secondary hover:underline">{contratoActual()}</a
            >
          </p>
        {/if}
        <button
          onclick={actualizar}
          disabled={actualizando}
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 font-heading text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
        >
          <i class="fa-solid {actualizando ? 'fa-circle-notch animate-spin' : 'fa-rotate'}"></i>
          Actualizar saldo y rol
        </button>
      </div>
    </Tarjeta>
  </div>
</div>
