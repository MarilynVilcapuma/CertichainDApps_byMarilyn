<script>
  import PanelHeader from '../components/PanelHeader.svelte'
  import LoginWallet from '../components/LoginWallet.svelte'
  import Resumen from './panel/Resumen.svelte'
  import Institucion from './Institucion.svelte'
  import Admin from './Admin.svelte'
  import Enviar from './Enviar.svelte'
  import Historial from './Historial.svelte'
  import Tarjeta from '../components/Tarjeta.svelte'
  import Boton from '../components/Boton.svelte'
  import { cambiarCuenta, contratoActual, desconectar, sesion } from '../lib/sesion.svelte.js'

  /** @type {{ ruta: string }} */
  let { ruta } = $props()

  const SUBRUTAS = {
    '/panel': Resumen,
    '/panel/institucion': Institucion,
    '/panel/admin': Admin,
    '/panel/enviar': Enviar,
    '/panel/historial': Historial
  }

  // Cada rol tiene su módulo exclusivo; Enviar e Historial son para cualquier wallet
  const PESTANAS = $derived.by(() => {
    const lista = [{ ruta: '/panel', texto: 'Resumen', icono: 'fa-gauge', exclusiva: false }]
    if (contratoActual()) {
      if (sesion.rol === 'admin') {
        lista.push({ ruta: '/panel/admin', texto: 'Módulo Admin', icono: 'fa-user-shield', exclusiva: true })
      } else if (sesion.rol === 'institucion') {
        lista.push({ ruta: '/panel/institucion', texto: 'Módulo Institución', icono: 'fa-building-columns', exclusiva: true })
      } else {
        lista.push({ ruta: '/panel/institucion', texto: 'Registrarme', icono: 'fa-file-signature', exclusiva: true })
      }
    }
    lista.push(
      { ruta: '/panel/enviar', texto: 'Enviar', icono: 'fa-paper-plane', exclusiva: false },
      { ruta: '/panel/historial', texto: 'Historial', icono: 'fa-clock-rotate-left', exclusiva: false }
    )
    return lista
  })

  const Pantalla = $derived(SUBRUTAS[ruta] ?? Resumen)
</script>

<PanelHeader />

<main class="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
  {#if !sesion.address}
    <LoginWallet />
  {:else if sesion.cuentaSinAutorizar}
    <div class="mx-auto max-w-md">
      <Tarjeta titulo="Cuenta no conectada" icono="fa-plug-circle-exclamation">
        <p class="mb-5 text-sm text-slate-400">
          La cuenta activa en tu wallet no está conectada a esta página. Elige la cuenta que quieres usar.
        </p>
        <div class="flex flex-col gap-3">
          <Boton onclick={cambiarCuenta}>Elegir cuenta</Boton>
          <Boton variante="secundario" onclick={desconectar}>Cerrar sesión</Boton>
        </div>
      </Tarjeta>
    </div>
  {:else}
    <nav class="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Panel">
      {#each PESTANAS as p (p.ruta)}
        {@const activa = ruta === p.ruta}
        <a
          href={`#${p.ruta}`}
          aria-current={activa ? 'page' : undefined}
          class="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 font-heading text-xs font-semibold whitespace-nowrap transition-all {activa
            ? 'border-mesh-secondary bg-mesh-secondary/10 text-mesh-secondary'
            : p.exclusiva
              ? 'border-mesh-primary/50 bg-mesh-primary/10 text-mesh-tertiary hover:border-mesh-secondary'
              : 'border-mesh-border bg-mesh-card text-slate-300 hover:border-mesh-secondary hover:text-white'}"
        >
          <i class="fa-solid {p.icono}"></i>
          {p.texto}
        </a>
      {/each}
    </nav>
    <Pantalla />
  {/if}
</main>
