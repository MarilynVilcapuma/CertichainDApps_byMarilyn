<script>
  import LoginWallet from '../components/LoginWallet.svelte'
  import { sesion } from '../lib/sesion.svelte.js'

  // Al iniciar sesión se entra al panel de la wallet
  $effect(() => {
    if (sesion.address) location.hash = '/panel'
  })
</script>

<LoginWallet />
