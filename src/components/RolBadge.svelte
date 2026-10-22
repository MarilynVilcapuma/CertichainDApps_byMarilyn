<script>
  import { sesion } from '../lib/sesion.svelte.js'

  // Mapa de clases completas por rol (Tailwind no detecta clases concatenadas)
  const ROLES = {
    admin: { texto: 'Admin', clases: 'border-mesh-primary/40 bg-mesh-primary/20 text-mesh-tertiary' },
    institucion: {
      texto: 'Institución',
      clases: 'border-mesh-secondary/40 bg-mesh-secondary/20 text-mesh-secondary'
    },
    visitante: { texto: 'Visitante', clases: 'border-slate-600 bg-slate-700/40 text-slate-300' }
  }

  const rol = $derived(ROLES[sesion.rol])
</script>

<span
  class="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase {rol.clases}"
>
  {rol.texto}
</span>
