<script>
  import { formatEther, hexlify, keccak256, randomBytes, toUtf8Bytes } from 'ethers'
  import QRCode from 'qrcode'
  import Tarjeta from '../components/Tarjeta.svelte'
  import Campo from '../components/Campo.svelte'
  import Boton from '../components/Boton.svelte'
  import Modal from '../components/Modal.svelte'
  import AvisoSinContrato from '../components/AvisoSinContrato.svelte'
  import { contratoConWallet, mensajeErrorContrato } from '../lib/contrato.js'
  import { describirRed } from '../lib/redes.js'
  import { contratoActual, proveedorActivo, refrescarRol, sesion } from '../lib/sesion.svelte.js'
  import { ejecutarTx, tx } from '../lib/tx.svelte.js'
  import { abreviar, formatearFecha, normalizarCodigo } from '../lib/util.js'

  const TIPOS = ['Certificado', 'Diploma', 'Constancia', 'Título']
  const red = $derived(describirRed(sesion.chainId ?? 0))

  /** Contrato con firma de la cuenta conectada, en la red actual */
  const contratoFirmante = () => contratoConWallet(proveedorActivo(), /** @type {number} */ (sesion.chainId), true)

  // ---------------- Registro (visitante) ----------------
  let nombreInstitucion = $state('')
  /** @type {bigint|null} */
  let tarifa = $state(null)
  let errorTarifa = $state('')

  $effect(() => {
    // Se relee al cambiar de red o de cuenta, y tras cada transacción confirmada
    void [sesion.chainId, sesion.address, tx.estado === 'confirmada']
    if (!contratoActual() || !proveedorActivo()) return
    contratoConWallet(proveedorActivo(), /** @type {number} */ (sesion.chainId))
      .then((c) => c.tarifaRegistro())
      .then((t) => {
        tarifa = t
        errorTarifa = ''
      })
      .catch((e) => {
        tarifa = null
        errorTarifa = mensajeErrorContrato(e)
      })
  })

  const sinSaldoParaTarifa = $derived(
    tarifa !== null && Number(sesion.saldo) < Number(formatEther(tarifa))
  )

  async function registrar(evento) {
    evento.preventDefault()
    const contrato = await contratoFirmante()
    if (!contrato) return
    // El pago debe ser EXACTAMENTE la tarifa vigente: se relee justo antes de enviar
    const valor = await contrato.tarifaRegistro()
    const recibo = await ejecutarTx('Registrar institución', () =>
      contrato.registrarInstitucion(nombreInstitucion.trim(), { value: valor })
    )
    if (!recibo) return
    // El nodo de la wallet puede tardar un instante en reflejar el bloque recién confirmado:
    // se relee el rol hasta que la cuenta figure como Institución y el módulo cambie solo.
    for (let intento = 0; intento < 6 && sesion.rol === 'visitante'; intento++) {
      await new Promise((r) => setTimeout(r, 1500))
      await refrescarRol()
    }
    nombreInstitucion = ''
  }

  // ---------------- Emitir (institución) ----------------
  let dni = $state('')
  let estudiante = $state('')
  let curso = $state('')
  let tipo = $state(TIPOS[0])
  let emitiendo = $state(false)
  /** @type {null | { codigo: string, enlace: string, qr: string, estudiante: string, chainId: number }} */
  let emitido = $state(null)
  let copiado = $state(false)

  const errorDni = $derived(dni && !/^\d{8}$/.test(dni.trim()) ? 'El DNI debe tener 8 dígitos.' : '')
  const emisionValida = $derived(
    /^\d{8}$/.test(dni.trim()) && estudiante.trim() !== '' && curso.trim() !== '' && !emitiendo
  )

  async function emitir(evento) {
    evento.preventDefault()
    if (!emisionValida) return
    emitiendo = true
    try {
      const contrato = await contratoFirmante()
      if (!contrato) return
      const chainId = /** @type {number} */ (sesion.chainId)

      // studentId = keccak256(DNI): el DNI nunca se guarda en texto.
      // certHash = keccak256(datos + sal aleatoria): sin la sal no se puede reconstruir.
      const studentId = keccak256(toUtf8Bytes(dni.trim()))
      const sal = hexlify(randomBytes(16))
      const certHash = keccak256(
        toUtf8Bytes([studentId, estudiante.trim(), curso.trim(), tipo, sal].join('|'))
      )

      const recibo = await ejecutarTx('Emitir certificado', () =>
        contrato.emitirCertificado(certHash, studentId, estudiante.trim(), curso.trim(), tipo)
      )
      if (!recibo) return

      const enlace = `${location.origin}${location.pathname}#/verificar?codigo=${certHash}&red=${chainId}`
      emitido = {
        codigo: certHash,
        enlace,
        qr: await QRCode.toDataURL(enlace, { width: 220, margin: 1, color: { dark: '#0a0e17', light: '#ffffff' } }),
        estudiante: estudiante.trim(),
        chainId
      }
      dni = ''
      estudiante = ''
      curso = ''
    } finally {
      emitiendo = false
    }
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(emitido?.codigo ?? '')
      copiado = true
      setTimeout(() => (copiado = false), 1500)
    } catch {
      /* portapapeles no disponible */
    }
  }

  // ---------------- Revocar (institución) ----------------
  let codigoRevocar = $state('')
  let errorRevocar = $state('')
  let comprobando = $state(false)
  let modalAbierto = $state(false)
  /** @type {null | { codigo: string, estudiante: string, curso: string, fecha: bigint }} */
  let aRevocar = $state(null)

  /** Comprueba el certificado ANTES de pedir la firma y abre el modal de confirmación */
  async function prepararRevocacion(evento) {
    evento.preventDefault()
    errorRevocar = ''
    const codigo = normalizarCodigo(codigoRevocar)
    if (!codigo) {
      errorRevocar = 'El código debe tener 64 caracteres hexadecimales (con o sin 0x).'
      return
    }
    comprobando = true
    try {
      const lector = await contratoConWallet(proveedorActivo(), /** @type {number} */ (sesion.chainId))
      const [, cert] = await lector.verificarCertificado(codigo)
      if (!cert.exists) errorRevocar = 'No existe un certificado con ese código en esta red.'
      else if (cert.revoked) errorRevocar = 'El certificado ya fue revocado.'
      else if (cert.issuer.toLowerCase() !== sesion.address?.toLowerCase())
        errorRevocar = 'Solo la institución que lo emitió puede revocarlo.'
      else {
        aRevocar = { codigo, estudiante: cert.studentName, curso: cert.courseName, fecha: cert.issueDate }
        modalAbierto = true
      }
    } catch (e) {
      errorRevocar = mensajeErrorContrato(e)
    } finally {
      comprobando = false
    }
  }

  async function confirmarRevocacion() {
    modalAbierto = false
    const objetivo = aRevocar
    if (!objetivo) return
    const contrato = await contratoFirmante()
    if (!contrato) return
    const recibo = await ejecutarTx('Revocar certificado', () => contrato.revocarCertificado(objetivo.codigo))
    if (recibo) codigoRevocar = ''
  }
</script>

{#if !contratoActual()}
  <AvisoSinContrato />
{:else if sesion.rol === 'admin'}
  <Tarjeta titulo="Módulo exclusivo de instituciones" icono="fa-building-columns">
    <p class="text-sm text-slate-400">
      Estás conectado como Admin. Las instituciones emiten desde su propia cuenta; tú gestionas la plataforma en
      <a href="#/panel/admin" class="text-mesh-secondary hover:underline">Módulo Admin</a>.
    </p>
  </Tarjeta>
{:else if sesion.rol === 'visitante'}
  <!-- ============ Registro ============ -->
  <div class="mx-auto max-w-xl">
    <Tarjeta titulo="Tu wallet aún no está registrada" icono="fa-file-signature">
      <p class="mb-5 text-sm text-slate-400">
        Registra tu institución en {red.nombre} para poder emitir certificados. El pago es único.
      </p>
      <form onsubmit={registrar} class="space-y-5">
        <Campo etiqueta="Nombre de la institución" bind:valor={nombreInstitucion} placeholder="Ej: Instituto Valle Grande" />
        <div class="flex items-center justify-between rounded-xl border border-mesh-border bg-mesh-input px-4 py-3 text-sm">
          <span class="text-slate-400">Tarifa de registro</span>
          {#if tarifa !== null}
            <span class="font-mono font-semibold text-mesh-secondary">
              {formatEther(tarifa)} {red.moneda.symbol}
            </span>
          {:else if errorTarifa}
            <span class="text-xs text-red-400">{errorTarifa}</span>
          {:else}
            <i class="fa-solid fa-circle-notch animate-spin text-slate-400"></i>
          {/if}
        </div>
        {#if sinSaldoParaTarifa}
          <p class="text-xs text-amber-400">
            Tu saldo ({sesion.saldo.slice(0, 8)} {red.moneda.symbol}) no cubre la tarifa más el gas.
          </p>
        {/if}
        <Boton
          tipo="submit"
          class="w-full"
          disabled={!nombreInstitucion.trim() || tarifa === null || tx.estado === 'firma' || tx.estado === 'enviada'}
        >
          <i class="fa-solid fa-coins"></i> Pagar y registrarme
        </Boton>
      </form>
    </Tarjeta>
  </div>
{:else}
  <!-- ============ Módulo de la institución emisora ============ -->
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3 rounded-xl border border-mesh-secondary/30 bg-mesh-secondary/10 px-4 py-3 text-sm">
      <i class="fa-solid fa-building-columns text-mesh-secondary"></i>
      <span class="font-heading font-semibold text-white">{sesion.nombreInstitucion}</span>
      <span class="text-slate-400">· institución emisora habilitada en {red.nombre}</span>
    </div>

    <div class="grid items-start gap-6 lg:grid-cols-2">
      <!-- Emitir -->
      <div class="space-y-6">
        <Tarjeta titulo="Emitir certificado" icono="fa-file-signature">
          <form onsubmit={emitir} class="space-y-4">
            <Campo etiqueta="DNI del estudiante" bind:valor={dni} placeholder="8 dígitos" error={errorDni} ayuda="Solo se guarda su hash." />
            <Campo etiqueta="Nombre del estudiante" bind:valor={estudiante} placeholder="Nombres y apellidos" />
            <Campo etiqueta="Curso o programa" bind:valor={curso} placeholder="Ej: Análisis de Sistemas" />
            <div class="flex flex-col gap-1.5">
              <label for="tipo-cert" class="font-heading text-xs font-semibold tracking-wider text-slate-300 uppercase">Tipo</label>
              <select
                id="tipo-cert"
                bind:value={tipo}
                class="w-full rounded-xl border border-mesh-border bg-mesh-input px-4 py-3 text-sm text-white focus:border-mesh-secondary focus:outline-none"
              >
                {#each TIPOS as t (t)}<option value={t}>{t}</option>{/each}
              </select>
            </div>
            <Boton tipo="submit" class="w-full" cargando={emitiendo} disabled={!emisionValida}>
              <i class="fa-solid fa-stamp"></i> Emitir certificado
            </Boton>
          </form>
        </Tarjeta>

        {#if emitido}
          <div class="mesh-card space-y-4 rounded-2xl border border-emerald-500/40 p-6">
            <div class="flex items-center gap-2 font-heading font-bold text-emerald-400">
              <i class="fa-solid fa-circle-check"></i> Certificado emitido para {emitido.estudiante}
            </div>
            <div class="flex flex-col items-center gap-4 sm:flex-row">
              <img src={emitido.qr} alt="QR para verificar el certificado" class="h-40 w-40 rounded-lg bg-white p-1" />
              <div class="min-w-0 flex-1 space-y-2">
                <div class="font-mono text-[11px] tracking-wider text-slate-400 uppercase">Código del certificado</div>
                <p class="rounded-lg border border-mesh-border bg-mesh-input p-2.5 font-mono text-xs break-all text-mesh-secondary">
                  {emitido.codigo}
                </p>
                <div class="flex flex-wrap gap-2 font-heading text-xs font-semibold">
                  <button onclick={copiarCodigo} class="rounded-lg bg-mesh-primary/80 px-3 py-2 text-white hover:bg-mesh-primary">
                    <i class="fa-solid {copiado ? 'fa-check' : 'fa-copy'}"></i> {copiado ? '¡Copiado!' : 'Copiar código'}
                  </button>
                  <a
                    href={emitido.enlace}
                    class="rounded-lg border border-mesh-border px-3 py-2 text-slate-300 hover:border-mesh-secondary hover:text-mesh-secondary"
                  >
                    <i class="fa-solid fa-shield-virus"></i> Verificar
                  </a>
                </div>
              </div>
            </div>
            <p class="text-xs text-amber-400">
              Guarda el código ahora: no se puede reconstruir después. Entrégalo al estudiante junto con el QR.
            </p>
          </div>
        {/if}
      </div>

      <!-- Revocar -->
      <Tarjeta titulo="Revocar certificado" icono="fa-ban">
        <form onsubmit={prepararRevocacion} class="space-y-4">
          <Campo
            etiqueta="Código del certificado"
            bind:valor={codigoRevocar}
            placeholder="0x… (64 caracteres)"
            mono
            error={errorRevocar}
          />
          <Boton tipo="submit" variante="peligro" class="w-full" cargando={comprobando} disabled={!codigoRevocar.trim()}>
            <i class="fa-solid fa-ban"></i> Revocar
          </Boton>
        </form>
      </Tarjeta>
    </div>
  </div>

  <Modal abierto={modalAbierto} titulo="¿Revocar este certificado?" onCerrar={() => (modalAbierto = false)}>
    {#if aRevocar}
      <dl class="space-y-2 text-sm">
        <div><dt class="text-xs text-slate-400">Estudiante</dt><dd class="font-semibold text-white">{aRevocar.estudiante}</dd></div>
        <div><dt class="text-xs text-slate-400">Curso</dt><dd class="text-slate-200">{aRevocar.curso}</dd></div>
        <div><dt class="text-xs text-slate-400">Emitido</dt><dd class="text-slate-200">{formatearFecha(aRevocar.fecha)}</dd></div>
        <div><dt class="text-xs text-slate-400">Código</dt><dd class="font-mono text-xs text-slate-300">{abreviar(aRevocar.codigo, 10, 8)}</dd></div>
      </dl>
      <p class="text-xs text-red-300">Esta acción queda registrada en la blockchain y no se puede deshacer.</p>
    {/if}
    <div class="flex gap-3 pt-2">
      <Boton variante="secundario" class="flex-1" onclick={() => (modalAbierto = false)}>Cancelar</Boton>
      <Boton variante="peligro" class="flex-1" onclick={confirmarRevocacion}>Sí, revocar</Boton>
    </div>
  </Modal>
{/if}
