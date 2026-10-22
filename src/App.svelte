<script>
  import Header from './components/Header.svelte'
  import Footer from './components/Footer.svelte'
  import Toast from './components/Toast.svelte'
  import TxNotificacion from './components/TxNotificacion.svelte'
  import SelectorCuenta from './components/SelectorCuenta.svelte'
  import Inicio from './routes/Inicio.svelte'
  import Verificar from './routes/Verificar.svelte'
  import Conectar from './routes/Conectar.svelte'
  import Panel from './routes/Panel.svelte'
  import { restaurar } from './lib/sesion.svelte.js'

  // Sitio público: no requiere wallet. Lo que requiere wallet vive en /panel/*
  const PUBLICAS = {
    '/': Inicio,
    '/verificar': Verificar,
    '/conectar': Conectar
  }

  // Enrutado por hash: funciona en nginx sin reglas extra de reescritura
  // La parte tras "?" son parámetros (ej. el código del QR), no forma parte de la ruta
  const leerRuta = () => location.hash.replace(/^#/, '').split('?')[0] || '/'
  let ruta = $state(leerRuta())

  $effect(() => {
    const alCambiar = () => {
      ruta = leerRuta()
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  })

  // Reconecta sin popup si la persona ya había autorizado la DApp
  $effect(() => {
    restaurar()
  })

  const enPanel = $derived(ruta === '/panel' || ruta.startsWith('/panel/'))
  const Pantalla = $derived(PUBLICAS[ruta] ?? Inicio)
</script>

<div
  class="bg-mesh-pattern relative flex min-h-screen flex-col overflow-x-clip bg-mesh-bg text-slate-100 antialiased selection:bg-mesh-primary selection:text-white"
>
  <div class="glow-violet top-0 left-1/4 h-[500px] w-[500px]"></div>
  <div class="glow-cyan top-1/3 -right-20 h-[450px] w-[450px]"></div>

  {#if enPanel}
    <Panel {ruta} />
  {:else}
    <Header {ruta} />
    <main class="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Pantalla />
    </main>
  {/if}
  <Footer />
  <Toast />
  <TxNotificacion />
  <SelectorCuenta />
</div>
