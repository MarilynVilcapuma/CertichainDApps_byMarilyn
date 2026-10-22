<script>
  import { describirRed } from '../lib/redes.js'
  import { sesion } from '../lib/sesion.svelte.js'
</script>

<div
  class="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200"
  role="status"
>
  <i class="fa-solid fa-triangle-exclamation mt-0.5 text-amber-400"></i>
  <div>
    <strong class="font-heading">CertiChain no está desplegado en esta red.</strong>
    <span class="text-amber-200/80">
      {#if sesion.chainId}Estás en {describirRed(sesion.chainId).nombre}. {/if}Cambia a Sepolia o Hoodi; Enviar e
      Historial siguen disponibles.
    </span>
  </div>
</div>
