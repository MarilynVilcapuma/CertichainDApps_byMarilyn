<script>
  import Logo from './Logo.svelte'
</script>

<footer class="relative z-10 border-t border-mesh-border/80 bg-mesh-bg py-10 text-xs text-slate-400">
  <div
    class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8"
  >
    <div class="flex items-center gap-2">
      <Logo class="h-6 w-6" id="hexGradientFooter" />
      <span class="font-heading text-base font-bold text-white">CertiChain Perú</span>
      <span class="hidden sm:inline">· Instituto Valle Grande · Marilyn Vilcapuma</span>
    </div>
    <div class="flex items-center gap-4 font-mono">
      <!-- TODO: reemplazar por el enlace real cuando se confirme el número del repositorio (AS241S6_42_CertiChain) -->
      <a
        href="https://github.com/MarilynVilcapuma"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 transition-colors hover:text-mesh-secondary"
      >
        <i class="fa-brands fa-github"></i> Repositorio
      </a>
      <span class="flex items-center gap-1.5">
        <span class="h-2 w-2 rounded-full bg-mesh-secondary"></span>
        EVM · Pali Wallet · MetaMask
      </span>
    </div>
  </div>
</footer>
