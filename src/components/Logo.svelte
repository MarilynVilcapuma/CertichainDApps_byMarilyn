<script>
  /** @type {{ class?: string, id?: string }} */
  let { class: extra = 'w-11 h-11', id = 'hexGradient' } = $props()
</script>

<svg class={extra} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <polygon points="50,5 92,28 92,72 50,95 8,72 8,28" fill="#0F172A" stroke="url(#{id})" stroke-width="4" />
  <path d="M50 25 L75 38 L50 51 L25 38 Z" fill="#22D3EE" opacity="0.9" />
  <path d="M35 45.5 V58 C35 64 65 64 65 58 V45.5" stroke="#A78BFA" stroke-width="3" stroke-linecap="round" fill="none" />
  <circle cx="50" cy="70" r="4" fill="#22D3EE" />
  <line x1="50" y1="62" x2="50" y2="66" stroke="#22D3EE" stroke-width="2" />
  <defs>
    <linearGradient {id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#22D3EE" />
    </linearGradient>
  </defs>
</svg>
