<script>
  import { keccak256, toUtf8Bytes } from 'ethers'
  import Tarjeta from '../components/Tarjeta.svelte'
  import Campo from '../components/Campo.svelte'
  import Boton from '../components/Boton.svelte'
  import { contratoPublico, mensajeErrorContrato } from '../lib/contrato.js'
  import { LISTA_REDES, REDES, contratoDeRed } from '../lib/redes.js'
  import { sesion } from '../lib/sesion.svelte.js'
  import { abreviar, formatearFecha, normalizarCodigo } from '../lib/util.js'

  // Verificar es público: usa el RPC de la red elegida, no la wallet
  const REDES_CON_CONTRATO = LISTA_REDES.filter((r) => r.contrato)

  /** Parámetros del enlace del QR: #/verificar?codigo=0x…&red=11155111 */
  function leerParametros() {
    const consulta = location.hash.split('?')[1] ?? ''
    return new URLSearchParams(consulta)
  }

  const inicial = leerParametros()
  const redInicial = Number(inicial.get('red')) || sesion.chainId
  let chainId = $state(contratoDeRed(redInicial) ? redInicial : REDES_CON_CONTRATO[0].chainId)

  let codigo = $state(inicial.get('codigo') ?? '')
  let dni = $state('')

  let cargando = $state(false)
  let error = $state('')
  /** @type {null | { codigo: string, valido: boolean, existe: boolean, revocado: boolean, cert: any, institucion: string }[]} */
  let resultados = $state(null)
  let origen = $state('')

  /** @param {string} certHash */
  async function consultar(contrato, certHash) {
    const [valido, cert, institucion] = await contrato.verificarCertificado(certHash)
    return {
      codigo: certHash,
      valido,
      existe: cert.exists,
      revocado: cert.revoked,
      cert: {
        estudiante: cert.studentName,
        curso: cert.courseName,
        tipo: cert.certificateType,
        fecha: cert.issueDate,
        emisor: cert.issuer
      },
      institucion
    }
  }

  /** Ejecuta una búsqueda con estados de carga y error */
  async function buscar(titulo, tarea) {
    error = ''
    resultados = null
    origen = titulo
    cargando = true
    try {
      const contrato = contratoPublico(chainId)
      if (!contrato) throw new Error('CertiChain no está desplegado en esta red.')
      resultados = await tarea(contrato)
    } catch (e) {
      error = mensajeErrorContrato(e)
    } finally {
      cargando = false
    }
  }

  function verificarCodigo(evento) {
    evento?.preventDefault()
    const certHash = normalizarCodigo(codigo)
    if (!certHash) {
      error = 'El código debe tener 64 caracteres hexadecimales (con o sin 0x).'
      resultados = null
      return
    }
    buscar('código', async (c) => [await consultar(c, certHash)])
  }

  function buscarPorDni(evento) {
    evento.preventDefault()
    const limpio = dni.trim()
    if (!/^\d{8}$/.test(limpio)) {
      error = 'El DNI debe tener 8 dígitos.'
      resultados = null
      return
    }
    // studentId = keccak256(DNI): el DNI nunca sale del navegador
    const studentId = keccak256(toUtf8Bytes(limpio))
    buscar('DNI', async (c) => {
      const codigos = await c.getCertificadosPorEstudiante(studentId)
      return Promise.all(codigos.map((h) => consultar(c, h)))
    })
  }

  // Si se llega desde un QR, el código ya viene cargado y se verifica de inmediato
  $effect(() => {
    if (inicial.get('codigo')) verificarCodigo()
  })

  // Mapa de clases completas por estado del resultado
  const ESTADOS = {
    valido: { texto: 'Válido', icono: 'fa-circle-check', clases: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
    revocado: { texto: 'Revocado', icono: 'fa-ban', clases: 'border-red-500/40 bg-red-950/30 text-red-400' },
    inexistente: { texto: 'No existe', icono: 'fa-circle-question', clases: 'border-slate-600 bg-slate-700/30 text-slate-300' }
  }

  const estadoDe = (r) => (r.valido ? ESTADOS.valido : r.existe ? ESTADOS.revocado : ESTADOS.inexistente)
</script>

<div class="mx-auto max-w-2xl space-y-6">
  <Tarjeta titulo="Verificar certificado" icono="fa-shield-virus">
    <form onsubmit={verificarCodigo} class="space-y-4">
      <Campo
        etiqueta="Código del certificado"
        bind:valor={codigo}
        placeholder="0x… (64 caracteres)"
        mono
        ayuda="No necesitas wallet ni pagar."
      />

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label for="red-verificar" class="mb-1.5 block font-heading text-xs font-semibold tracking-wider text-slate-300 uppercase">Red</label>
          <select
            id="red-verificar"
            bind:value={chainId}
            class="w-full rounded-xl border border-mesh-border bg-mesh-input px-4 py-3 text-sm text-white focus:border-mesh-secondary focus:outline-none"
          >
            {#each REDES_CON_CONTRATO as r (r.chainId)}
              <option value={r.chainId}>{r.nombre}</option>
            {/each}
          </select>
        </div>
        <Boton tipo="submit" cargando={cargando && origen === 'código'} disabled={cargando || !codigo.trim()}>
          <i class="fa-solid fa-shield-virus"></i> Verificar
        </Boton>
      </div>
    </form>

    <!-- Opción secundaria -->
    <form onsubmit={buscarPorDni} class="mt-6 space-y-2 border-t border-mesh-border pt-5">
      <Campo etiqueta="O busca por DNI del estudiante" bind:valor={dni} placeholder="8 dígitos" ayuda="Se convierte a hash en tu navegador: el DNI no se envía a ninguna parte." />
      <Boton tipo="submit" variante="secundario" class="w-full" cargando={cargando && origen === 'DNI'} disabled={cargando || !dni.trim()}>
        Buscar por DNI
      </Boton>
    </form>
  </Tarjeta>

  {#if error}
    <div class="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300" role="alert">
      <i class="fa-solid fa-circle-exclamation mr-1"></i>{error}
    </div>
  {/if}

  {#if cargando}
    <p class="text-center text-sm text-slate-400"><i class="fa-solid fa-circle-notch animate-spin"></i> Consultando {REDES[chainId].nombre}…</p>
  {:else if resultados}
    {#if resultados.length === 0}
      <div class="rounded-xl border border-slate-600 bg-slate-700/30 p-5 text-center text-sm text-slate-300">
        No hay certificados registrados para ese DNI en {REDES[chainId].nombre}.
      </div>
    {/if}
    {#each resultados as r (r.codigo)}
      {@const estado = estadoDe(r)}
      <div class="mesh-card space-y-4 rounded-2xl border p-6 {estado.clases}">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="inline-flex items-center gap-2 font-heading text-lg font-bold">
            <i class="fa-solid {estado.icono}"></i> {estado.texto}
          </span>
          <span class="font-mono text-xs text-slate-400" title={r.codigo}>{abreviar(r.codigo, 10, 8)}</span>
        </div>

        {#if r.existe}
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-xs text-slate-400">Estudiante</dt>
              <dd class="font-semibold text-white">{r.cert.estudiante}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">Institución</dt>
              <dd class="font-semibold text-white">{r.institucion || abreviar(r.cert.emisor)}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">Curso</dt>
              <dd class="text-slate-200">{r.cert.curso}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">Tipo</dt>
              <dd class="text-slate-200">{r.cert.tipo || '—'}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-slate-400">Fecha de emisión</dt>
              <dd class="text-slate-200">{formatearFecha(r.cert.fecha)}</dd>
            </div>
          </dl>
          {#if r.revocado}
            <p class="text-xs text-red-300">La institución revocó este certificado: ya no es válido.</p>
          {/if}
        {:else}
          <p class="text-sm text-slate-300">
            Ningún certificado con ese código en {REDES[chainId].nombre}. Revisa el código o la red.
          </p>
        {/if}
      </div>
    {/each}
  {/if}
</div>
