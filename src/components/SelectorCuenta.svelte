<script>
  import Modal from './Modal.svelte'
  import Boton from './Boton.svelte'
  import { elegirCuenta, sesion } from '../lib/sesion.svelte.js'
  import { abreviar } from '../lib/util.js'
</script>

<!-- Solo aparece cuando la wallet entrega varias cuentas autorizadas -->
<Modal abierto={sesion.opcionesCuenta.length > 1} titulo="¿Con qué cuenta quieres continuar?" onCerrar={() => elegirCuenta(null)}>
  <ul class="space-y-2">
    {#each sesion.opcionesCuenta as cuenta, i (cuenta)}
      <li>
        <button
          onclick={() => elegirCuenta(cuenta)}
          class="flex w-full items-center gap-3 rounded-xl border border-mesh-border bg-mesh-input px-4 py-3 text-left transition-colors hover:border-mesh-secondary"
        >
          <i class="fa-solid fa-user text-mesh-tertiary"></i>
          <span class="min-w-0 flex-1">
            <span class="block font-heading text-xs text-slate-400">Cuenta {i + 1}</span>
            <span class="block truncate font-mono text-sm text-white" title={cuenta}>{abreviar(cuenta, 10, 8)}</span>
          </span>
        </button>
      </li>
    {/each}
  </ul>
  <Boton variante="texto" class="w-full" onclick={() => elegirCuenta(null)}>Cancelar</Boton>
</Modal>
