<script>
  import { sesion } from '../lib/sesion.svelte.js'

  // ---- Contenido editable ----
  const desarrolladora = {
    nombre: 'Marilyn Vilcapuma',
    rol: 'Estudiante de Análisis de Sistemas',
    institucion: 'Instituto Valle Grande',
    foto: '/fotito.png',
    bio:
      'Apasionada por blockchain y el desarrollo web. Creó CertiChain Perú para digitalizar y asegurar ' +
      'la verificación de documentos académicos con tecnología descentralizada.',
    github: 'https://github.com/MarilynVilcapuma',
    tecnologias: ['Svelte 5', 'Tailwind CSS', 'Ethers.js', 'Solidity / EVM', 'Pali Wallet', 'MetaMask']
  }

  const introduccion =
    'CertiChain Perú es una plataforma descentralizada para emitir y verificar certificados académicos en ' +
    'blockchain. Las instituciones se registran una sola vez, pagando una tarifa, y desde ese momento emiten ' +
    'certificados con un código único que queda registrado de forma permanente y no puede alterarse en silencio. ' +
    'Cualquier reclutador o empresa verifica la autenticidad en segundos, sin cuenta, sin wallet y sin contactar ' +
    'a la institución. El Instituto Valle Grande es la institución piloto y la plataforma funciona en varias ' +
    'redes, mostrando el historial según la red conectada.'

  // Un rol por tarjeta: qué hace y qué ve en el menú
  const roles = [
    {
      icono: 'fa-magnifying-glass',
      color: 'cian',
      titulo: 'Reclutador',
      acceso: 'Sin wallet',
      texto: 'Verifica un certificado con su código o con el DNI del estudiante.',
      menu: ['Inicio', 'Verificar']
    },
    {
      icono: 'fa-building-columns',
      color: 'primario',
      titulo: 'Institución',
      acceso: 'Se registra una vez',
      texto: 'Paga la tarifa de registro y desde entonces emite y revoca certificados.',
      menu: ['Registrarme / Emitir', 'Verificar', 'Enviar', 'Historial']
    },
    {
      icono: 'fa-user-shield',
      color: 'ambar',
      titulo: 'Admin',
      acceso: 'Wallet que desplegó el contrato',
      texto: 'Cobra lo recaudado, activa o desactiva instituciones y cambia la tarifa.',
      menu: ['Admin', 'Verificar', 'Enviar', 'Historial']
    }
  ]

  const objetivoGeneral =
    'Ofrecer una plataforma que permita emitir y verificar certificados de manera segura, transparente ' +
    'e inmutable, usando blockchain.'

  const objetivosEspecificos = [
    'Generar un código único e irrepetible para cada certificado (hash de sus datos con una sal aleatoria).',
    'Integrar wallets Web3 (Pali y MetaMask) para firmar y validar las transacciones.',
    'Permitir la verificación abierta e instantánea del estado de un certificado.',
    'Mantener un registro auditable de cada emisión y revocación.'
  ]

  // Mapa de clases completas por color (Tailwind no detecta clases concatenadas)
  const COLORES = {
    primario: 'bg-mesh-primary/20 border-mesh-primary/40 text-mesh-tertiary',
    cian: 'bg-mesh-secondary/20 border-mesh-secondary/40 text-mesh-secondary',
    ambar: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    esmeralda: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    rosa: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    naranja: 'bg-orange-500/20 border-orange-500/40 text-orange-300'
  }

  const beneficios = [
    { icono: 'fa-shield-halved', color: 'primario', titulo: 'Seguridad', texto: 'Un certificado registrado no puede falsificarse ni modificarse.' },
    { icono: 'fa-eye', color: 'cian', titulo: 'Transparencia', texto: 'Cualquiera comprueba la autenticidad sin llamar a la institución.' },
    { icono: 'fa-bolt', color: 'ambar', titulo: 'Rapidez', texto: 'La verificación toma segundos, sin trámites ni papeleo.' },
    { icono: 'fa-coins', color: 'esmeralda', titulo: 'Menos costos', texto: 'Sin legalizaciones notariales ni intermediarios.' }
  ]

  const caracteristicas = [
    { icono: 'fa-hashtag', color: 'primario', titulo: 'Código único', texto: 'Hash de los datos del certificado con una sal aleatoria.' },
    { icono: 'fa-wallet', color: 'naranja', titulo: 'Pali y MetaMask', texto: 'Inicio de sesión con la wallet que prefieras.' },
    { icono: 'fa-globe', color: 'cian', titulo: 'Consulta pública', texto: 'Verificar no requiere wallet, cuenta ni pago.' },
    { icono: 'fa-user-shield', color: 'esmeralda', titulo: 'Privacidad', texto: 'El DNI nunca se guarda: solo su hash keccak256.' },
    { icono: 'fa-network-wired', color: 'rosa', titulo: 'Multired', texto: 'Sepolia, Hoodi y zkSYS, con cambio de red automático.' },
    { icono: 'fa-clock-rotate-left', color: 'esmeralda', titulo: 'Historial por red', texto: 'Tus transacciones según la red conectada, tomadas del explorador.' },
    { icono: 'fa-qrcode', color: 'ambar', titulo: 'Código QR', texto: 'Cada certificado enlaza directo a su verificación.' },
    { icono: 'fa-arrows-rotate', color: 'cian', titulo: 'Roles dinámicos', texto: 'El menú y los permisos se recalculan al cambiar de cuenta o de red.' }
  ]
</script>

<div class="space-y-24">
  <!-- ============ Hero ============ -->
  <section id="inicio" class="grid items-center gap-12 lg:grid-cols-12">
    <div class="space-y-6 text-center lg:col-span-7 lg:text-left">
      <div
        class="mesh-card inline-flex items-center gap-2 rounded-full border border-mesh-primary/40 px-3.5 py-1.5 font-heading text-xs font-medium text-mesh-tertiary"
      >
        <span class="h-2 w-2 animate-ping rounded-full bg-mesh-secondary"></span>
        Certificados verificables en blockchain
      </div>
      <h1 class="font-heading text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
        Certificados que nadie puede falsificar.
        <span class="block bg-gradient-to-r from-mesh-primary via-mesh-tertiary to-mesh-secondary bg-clip-text text-transparent">
          Verifícalos en segundos.
        </span>
      </h1>
      <p class="mx-auto max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg lg:mx-0">
        <strong class="font-semibold text-white">CertiChain Perú</strong> registra cada certificado en la blockchain.
        Verificar es gratis y no necesitas wallet ni cuenta.
      </p>
      <div class="flex flex-col items-center gap-4 pt-2 sm:flex-row lg:justify-start sm:justify-center">
        <a
          href="#/verificar"
          class="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-mesh-primary to-mesh-secondary px-8 py-4 font-heading text-sm font-bold text-slate-950 shadow-lg shadow-mesh-primary/30 transition-all hover:opacity-95 sm:w-auto"
        >
          <i class="fa-solid fa-magnifying-glass"></i>
          Verificar certificado
          <i class="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
        </a>
        <a
          href={sesion.address ? '#/panel' : '#/conectar'}
          class="mesh-card flex w-full items-center justify-center gap-2 rounded-xl border border-mesh-border px-8 py-4 font-heading text-sm font-bold text-slate-200 transition-all hover:bg-mesh-cardHover sm:w-auto"
        >
          <i class="fa-solid fa-wallet text-mesh-secondary"></i>
          {sesion.address ? 'Ir a mi panel' : 'Conectar wallet'}
        </a>
      </div>
    </div>

    <!-- Tarjeta ilustrativa (no son datos reales) -->
    <div class="lg:col-span-5">
      <div class="mesh-card relative overflow-hidden rounded-2xl border border-mesh-primary/40 p-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-mesh-border pb-4">
          <div class="flex items-center gap-2" aria-hidden="true">
            <span class="inline-block h-3 w-3 rounded-full bg-red-500/80"></span>
            <span class="inline-block h-3 w-3 rounded-full bg-yellow-500/80"></span>
            <span class="inline-block h-3 w-3 rounded-full bg-green-500/80"></span>
          </div>
          <span class="font-mono text-xs text-slate-400">Ejemplo ilustrativo</span>
        </div>
        <div class="mt-5 space-y-4 text-left">
          <div class="rounded-xl border border-mesh-border bg-mesh-input p-4">
            <div class="mb-2 flex items-center justify-between font-heading text-xs text-slate-400">
              <span>ESTADO</span>
              <span class="flex items-center gap-1 font-mono text-emerald-400">
                <i class="fa-solid fa-circle-check"></i> VÁLIDO
              </span>
            </div>
            <div class="flex items-center gap-2 font-heading text-sm font-bold text-white">
              <i class="fa-solid fa-graduation-cap text-mesh-tertiary"></i>
              Instituto Valle Grande
            </div>
            <div class="mt-1 text-xs text-slate-300">Institución emisora</div>
          </div>
          <div class="space-y-2 rounded-xl border border-mesh-primary/30 bg-slate-950/80 p-4">
            <div class="font-mono text-[11px] tracking-wider text-slate-400 uppercase">Código del certificado</div>
            <div class="rounded-lg border border-slate-800 bg-mesh-input p-2.5 font-mono text-xs break-all text-mesh-secondary">
              0x…  (se genera al emitir)
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-mesh-primary/30 bg-mesh-primary/10 p-3.5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mesh-primary/20 text-mesh-tertiary">
              <i class="fa-solid fa-user-graduate text-lg"></i>
            </div>
            <div class="text-xs">
              <div class="font-heading font-semibold text-white">Titular</div>
              <div class="text-slate-300">Solo se guarda el hash del DNI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ Descripción ============ -->
  <section id="descripcion" class="space-y-8">
    <div class="mx-auto max-w-3xl text-center">
      <span class="rounded-full border border-mesh-secondary/20 bg-mesh-secondary/10 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-widest text-mesh-secondary uppercase">Descripción</span>
      <h2 class="mt-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">Una entrada, tres roles</h2>
      <p class="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">{introduccion}</p>
    </div>
    <div class="grid gap-5 md:grid-cols-3">
      {#each roles as rol (rol.titulo)}
        <div class="mesh-card mesh-card-hover flex flex-col rounded-2xl p-6">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl border {COLORES[rol.color]}">
              <i class="fa-solid {rol.icono} text-xl"></i>
            </div>
            <span class="rounded-full border border-mesh-border bg-mesh-input px-2.5 py-1 font-mono text-[10px] text-slate-300">{rol.acceso}</span>
          </div>
          <h3 class="font-heading text-lg font-bold text-white">{rol.titulo}</h3>
          <p class="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">{rol.texto}</p>
          <div class="mt-4 flex flex-wrap gap-1.5 border-t border-mesh-border pt-4 font-mono text-[11px]">
            {#each rol.menu as item (item)}
              <span class="rounded-md bg-mesh-input px-2 py-0.5 text-mesh-secondary">{item}</span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    <p class="text-center text-sm text-slate-400">
      Con wallet conectada, todos pueden además <strong class="text-slate-200">enviar</strong> moneda y ver el
      <strong class="text-slate-200">historial</strong> de su red.
    </p>
  </section>

  <!-- ============ Objetivos ============ -->
  <section id="objetivos" class="space-y-8">
    <div class="mx-auto max-w-3xl text-center">
      <span class="rounded-full border border-mesh-primary/20 bg-mesh-primary/10 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-widest text-mesh-tertiary uppercase">Objetivos</span>
      <h2 class="mt-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">Qué buscamos</h2>
    </div>
    <div class="mesh-card mx-auto max-w-4xl space-y-6 rounded-2xl border border-mesh-primary/30 p-6 sm:p-8">
      <div>
        <h3 class="mb-2 flex items-center gap-2 font-heading text-sm font-bold tracking-wider text-mesh-secondary uppercase">
          <i class="fa-solid fa-bullseye"></i> Objetivo general
        </h3>
        <p class="text-sm leading-relaxed text-slate-300 sm:text-base">{objetivoGeneral}</p>
      </div>
      <div class="border-t border-mesh-border pt-6">
        <h3 class="mb-3 flex items-center gap-2 font-heading text-sm font-bold tracking-wider text-mesh-secondary uppercase">
          <i class="fa-solid fa-list-check"></i> Objetivos específicos
        </h3>
        <ul class="space-y-3">
          {#each objetivosEspecificos as objetivo (objetivo)}
            <li class="flex items-start gap-3 text-sm text-slate-300">
              <i class="fa-solid fa-circle-check mt-0.5 text-mesh-tertiary"></i>
              <span>{objetivo}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <!-- ============ Beneficios ============ -->
  <section id="beneficios" class="space-y-8">
    <div class="mx-auto max-w-3xl text-center">
      <span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-widest text-emerald-400 uppercase">Beneficios</span>
      <h2 class="mt-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">Por qué usarlo</h2>
    </div>
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {#each beneficios as b (b.titulo)}
        <div class="mesh-card mesh-card-hover rounded-2xl p-6">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border {COLORES[b.color]}">
            <i class="fa-solid {b.icono} text-xl"></i>
          </div>
          <h3 class="font-heading text-base font-bold text-white">{b.titulo}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-slate-400">{b.texto}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- ============ Características ============ -->
  <section id="caracteristicas" class="space-y-8">
    <div class="mx-auto max-w-3xl text-center">
      <span class="rounded-full border border-mesh-secondary/20 bg-mesh-secondary/10 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-widest text-mesh-secondary uppercase">Características</span>
      <h2 class="mt-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">Qué incluye</h2>
    </div>
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each caracteristicas as c (c.titulo)}
        <div class="mesh-card mesh-card-hover flex items-start gap-4 rounded-2xl p-5">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border {COLORES[c.color]}">
            <i class="fa-solid {c.icono}"></i>
          </div>
          <div>
            <h3 class="font-heading text-base font-bold text-white">{c.titulo}</h3>
            <p class="mt-1 text-sm leading-relaxed text-slate-400">{c.texto}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ============ Desarrolladora ============ -->
  <section id="desarrolladora" class="space-y-8">
    <div class="mx-auto max-w-3xl text-center">
      <span class="rounded-full border border-mesh-primary/20 bg-mesh-primary/10 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-widest text-mesh-tertiary uppercase">Desarrolladora</span>
      <h2 class="mt-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">Quién lo hizo</h2>
    </div>
    <div class="mesh-card mx-auto max-w-4xl rounded-3xl border border-mesh-primary/40 p-8 sm:p-10">
      <div class="grid items-center gap-8 md:grid-cols-12">
        <div class="flex justify-center md:col-span-4">
          <div class="group relative">
            <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-mesh-primary to-mesh-secondary opacity-80 blur transition duration-300 group-hover:opacity-100"></div>
            <img
              src={desarrolladora.foto}
              alt={desarrolladora.nombre}
              class="relative h-40 w-40 rounded-full border-2 border-slate-900 object-cover shadow-xl"
            />
          </div>
        </div>
        <div class="space-y-4 text-center md:col-span-8 md:text-left">
          <div class="space-y-1">
            <h3 class="font-heading text-2xl font-bold text-white sm:text-3xl">{desarrolladora.nombre}</h3>
            <p class="flex items-center justify-center gap-2 text-sm text-slate-300 md:justify-start">
              <i class="fa-solid fa-graduation-cap text-mesh-secondary"></i>
              <span>{desarrolladora.rol} · <strong>{desarrolladora.institucion}</strong></span>
            </p>
          </div>
          <p class="border-t border-mesh-border pt-4 text-sm leading-relaxed text-slate-300">{desarrolladora.bio}</p>
          <div class="flex flex-wrap justify-center gap-2 font-mono text-[11px] md:justify-start">
            {#each desarrolladora.tecnologias as t (t)}
              <span class="rounded-lg border border-mesh-border bg-mesh-input px-2.5 py-1 text-mesh-secondary">{t}</span>
            {/each}
          </div>
          <a
            href={desarrolladora.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Perfil de GitHub"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-mesh-border bg-mesh-input text-slate-200 transition-colors hover:bg-slate-800"
          >
            <i class="fa-brands fa-github text-base"></i>
          </a>
        </div>
      </div>
    </div>
  </section>
</div>
