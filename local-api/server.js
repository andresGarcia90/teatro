import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg

const app = express()

app.use(cors())
app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'teatro',
  user: process.env.DB_USER || 'teatro',
  password: process.env.DB_PASSWORD || 'teatro123',
})

function normalizeRowPrefix(value) {
  return (value || 'A').toString().trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1) || 'A'
}

function buildRowLabels(startRow, count) {
  const start = normalizeRowPrefix(startRow)
  const startCode = start.charCodeAt(0)

  if (startCode + count - 1 > 'Z'.charCodeAt(0)) {
    throw new Error('El rango de filas excede Z. Reduce la cantidad de filas o cambia fila inicial.')
  }

  return Array.from({ length: count }, (_, index) => String.fromCharCode(startCode + index))
}

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true, service: 'local-api' })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/estado', async (_req, res) => {
  try {
    const eventResult = await pool.query(
      `
      select
        e.id,
        e.nombre,
        e.fecha_evento,
        e.fecha_cierre_reservas,
        e.activo,
        c.max_entradas_por_persona,
        c.reservas_habilitadas
      from eventos e
      left join configuracion c on c.evento_id = e.id
      where e.activo = true
      limit 1
      `,
    )

    if (eventResult.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: 'No hay un evento activo en la base local.',
      })
    }

    const evento = eventResult.rows[0]

    const [seccionesResult, asientosResult, reservasResult] = await Promise.all([
      pool.query('select count(*)::int as total from secciones where evento_id = $1', [evento.id]),
      pool.query(
        `
        select count(*)::int as total
        from asientos a
        join secciones s on s.id = a.seccion_id
        where s.evento_id = $1
        `,
        [evento.id],
      ),
      pool.query('select count(*)::int as total from reservas where evento_id = $1', [evento.id]),
    ])

    return res.json({
      ok: true,
      mode: 'local',
      evento,
      metricas: {
        secciones: seccionesResult.rows[0].total,
        asientos: asientosResult.rows[0].total,
        reservas: reservasResult.rows[0].total,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/backoffice/configuracion', async (_req, res) => {
  try {
    const result = await pool.query(
      `
      select
        e.id as evento_id,
        e.nombre as nombre_evento,
        e.descripcion,
        e.fecha_evento,
        e.horario,
        e.direccion,
        e.fecha_cierre_reservas,
        coalesce(c.max_entradas_por_persona, 1) as max_entradas_por_persona,
        coalesce(c.reservas_habilitadas, true) as reservas_habilitadas
      from eventos e
      left join configuracion c on c.evento_id = e.id
      where e.activo = true
      limit 1
      `,
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: 'No hay evento activo para configurar.',
      })
    }

    const row = result.rows[0]

    return res.json({
      ok: true,
      configuracion: {
        eventoId: row.evento_id,
        nombreEvento: row.nombre_evento,
        descripcion: row.descripcion || null,
        fechaEvento: row.fecha_evento,
        horario: row.horario || null,
        direccion: row.direccion || null,
        fechaCierreReservas: row.fecha_cierre_reservas,
        maxEntradasPorPersona: row.max_entradas_por_persona,
        reservasHabilitadas: row.reservas_habilitadas,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.put('/api/backoffice/configuracion', async (req, res) => {
  const {
    nombreEvento,
    descripcion,
    horario,
    direccion,
    fechaCierreReservas,
    maxEntradasPorPersona,
    reservasHabilitadas,
  } = req.body || {}

  if (!nombreEvento || typeof nombreEvento !== 'string') {
    return res.status(400).json({ ok: false, message: 'nombreEvento es obligatorio.' })
  }

  if (!fechaCierreReservas || typeof fechaCierreReservas !== 'string') {
    return res.status(400).json({ ok: false, message: 'fechaCierreReservas es obligatoria.' })
  }

  if (!Number.isInteger(maxEntradasPorPersona) || maxEntradasPorPersona < 1) {
    return res.status(400).json({
      ok: false,
      message: 'maxEntradasPorPersona debe ser un entero mayor o igual a 1.',
    })
  }

  if (typeof reservasHabilitadas !== 'boolean') {
    return res.status(400).json({ ok: false, message: 'reservasHabilitadas debe ser boolean.' })
  }

  const client = await pool.connect()

  try {
    await client.query('begin')

    const normalizedDescripcion =
      typeof descripcion === 'string' && descripcion.trim().length > 0 ? descripcion.trim() : null
    const normalizedHorario =
      typeof horario === 'string' && horario.trim().length > 0 ? horario.trim() : null
    const normalizedDireccion =
      typeof direccion === 'string' && direccion.trim().length > 0 ? direccion.trim() : null

    const activeEventResult = await client.query(
      `
      select id, fecha_evento
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      await client.query('rollback')
      return res.status(404).json({ ok: false, message: 'No hay evento activo para configurar.' })
    }

    const evento = activeEventResult.rows[0]

    await client.query(
      `
      update eventos
      set nombre = $1,
          descripcion = $2,
          horario = $3::time,
          direccion = $4,
          fecha_cierre_reservas = $5::timestamptz
      where id = $6
      `,
      [
        nombreEvento.trim(),
        normalizedDescripcion,
        normalizedHorario,
        normalizedDireccion,
        fechaCierreReservas,
        evento.id,
      ],
    )

    await client.query(
      `
      insert into configuracion (evento_id, max_entradas_por_persona, reservas_habilitadas)
      values ($1, $2, $3)
      on conflict (evento_id)
      do update
        set max_entradas_por_persona = excluded.max_entradas_por_persona,
            reservas_habilitadas = excluded.reservas_habilitadas
      `,
      [evento.id, maxEntradasPorPersona, reservasHabilitadas],
    )

    const finalResult = await client.query(
      `
      select
        e.id as evento_id,
        e.nombre as nombre_evento,
        e.descripcion,
        e.fecha_evento,
        e.horario,
        e.direccion,
        e.fecha_cierre_reservas,
        c.max_entradas_por_persona,
        c.reservas_habilitadas
      from eventos e
      join configuracion c on c.evento_id = e.id
      where e.id = $1
      limit 1
      `,
      [evento.id],
    )

    await client.query('commit')

    const row = finalResult.rows[0]

    return res.json({
      ok: true,
      configuracion: {
        eventoId: row.evento_id,
        nombreEvento: row.nombre_evento,
        descripcion: row.descripcion || null,
        fechaEvento: row.fecha_evento,
        horario: row.horario || null,
        direccion: row.direccion || null,
        fechaCierreReservas: row.fecha_cierre_reservas,
        maxEntradasPorPersona: row.max_entradas_por_persona,
        reservasHabilitadas: row.reservas_habilitadas,
      },
    })
  } catch (error) {
    await client.query('rollback')
    return res.status(500).json({ ok: false, error: error.message })
  } finally {
    client.release()
  }
})

app.get('/api/backoffice/secciones', async (_req, res) => {
  try {
    const activeEventResult = await pool.query(
      `
      select id
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const eventoId = activeEventResult.rows[0].id

    const sectionsResult = await pool.query(
      `
      select id, nombre, orden
      from secciones
      where evento_id = $1
      order by orden asc, nombre asc
      `,
      [eventoId],
    )

    return res.json({
      ok: true,
      secciones: sectionsResult.rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        orden: row.orden,
      })),
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/backoffice/secciones', async (req, res) => {
  const { nombre, orden } = req.body || {}

  if (!nombre || typeof nombre !== 'string') {
    return res.status(400).json({ ok: false, message: 'nombre es obligatorio.' })
  }

  if (!Number.isInteger(orden) || orden < 0) {
    return res.status(400).json({ ok: false, message: 'orden debe ser entero mayor o igual a 0.' })
  }

  try {
    const activeEventResult = await pool.query(
      `
      select id
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const eventoId = activeEventResult.rows[0].id

    const insertResult = await pool.query(
      `
      insert into secciones (evento_id, nombre, orden)
      values ($1, $2, $3)
      returning id, nombre, orden
      `,
      [eventoId, nombre.trim(), orden],
    )

    const row = insertResult.rows[0]
    return res.status(201).json({
      ok: true,
      seccion: {
        id: row.id,
        nombre: row.nombre,
        orden: row.orden,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.put('/api/backoffice/secciones/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, orden } = req.body || {}

  if (!nombre || typeof nombre !== 'string') {
    return res.status(400).json({ ok: false, message: 'nombre es obligatorio.' })
  }

  if (!Number.isInteger(orden) || orden < 0) {
    return res.status(400).json({ ok: false, message: 'orden debe ser entero mayor o igual a 0.' })
  }

  try {
    const activeEventResult = await pool.query(
      `
      select id
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const eventoId = activeEventResult.rows[0].id

    const updateResult = await pool.query(
      `
      update secciones
      set nombre = $1,
          orden = $2
      where id = $3
        and evento_id = $4
      returning id, nombre, orden
      `,
      [nombre.trim(), orden, id, eventoId],
    )

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Seccion no encontrada.' })
    }

    const row = updateResult.rows[0]
    return res.json({
      ok: true,
      seccion: {
        id: row.id,
        nombre: row.nombre,
        orden: row.orden,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.delete('/api/backoffice/secciones/:id', async (req, res) => {
  const { id } = req.params

  try {
    const activeEventResult = await pool.query(
      `
      select id
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const eventoId = activeEventResult.rows[0].id

    const deleteResult = await pool.query(
      `
      delete from secciones
      where id = $1
        and evento_id = $2
      returning id
      `,
      [id, eventoId],
    )

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Seccion no encontrada.' })
    }

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/backoffice/secciones/:id/asientos/resumen', async (req, res) => {
  const { id } = req.params

  try {
    const sectionsResult = await pool.query(
      `
      select s.id
      from secciones s
      join eventos e on e.id = s.evento_id
      where s.id = $1
        and e.activo = true
      limit 1
      `,
      [id],
    )

    if (sectionsResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Seccion no encontrada en evento activo.' })
    }

    const summaryResult = await pool.query(
      `
      select
        count(*)::int as total_asientos,
        count(distinct fila)::int as filas
      from asientos
      where seccion_id = $1
      `,
      [id],
    )

    const row = summaryResult.rows[0]

    return res.json({
      ok: true,
      resumen: {
        totalAsientos: row.total_asientos,
        filas: row.filas,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/backoffice/secciones/:id/asientos/generar', async (req, res) => {
  const { id } = req.params
  const { filaInicio, cantidadFilas, asientosPorFila, sobrescribir } = req.body || {}

  if (!Number.isInteger(cantidadFilas) || cantidadFilas < 1) {
    return res.status(400).json({ ok: false, message: 'cantidadFilas debe ser entero mayor o igual a 1.' })
  }

  if (!Number.isInteger(asientosPorFila) || asientosPorFila < 1) {
    return res
      .status(400)
      .json({ ok: false, message: 'asientosPorFila debe ser entero mayor o igual a 1.' })
  }

  if (typeof sobrescribir !== 'boolean') {
    return res.status(400).json({ ok: false, message: 'sobrescribir debe ser boolean.' })
  }

  const client = await pool.connect()

  try {
    await client.query('begin')

    const sectionResult = await client.query(
      `
      select s.id
      from secciones s
      join eventos e on e.id = s.evento_id
      where s.id = $1
        and e.activo = true
      limit 1
      `,
      [id],
    )

    if (sectionResult.rowCount === 0) {
      await client.query('rollback')
      return res.status(404).json({ ok: false, message: 'Seccion no encontrada en evento activo.' })
    }

    const rows = buildRowLabels(filaInicio, cantidadFilas)

    if (sobrescribir) {
      await client.query('delete from asientos where seccion_id = $1', [id])
    }

    for (const fila of rows) {
      for (let numero = 1; numero <= asientosPorFila; numero += 1) {
        await client.query(
          `
          insert into asientos (seccion_id, fila, numero, codigo_asiento)
          values ($1, $2, $3, $4)
          on conflict (seccion_id, fila, numero)
          do update set codigo_asiento = excluded.codigo_asiento
          `,
          [id, fila, numero, `${fila}-${numero}`],
        )
      }
    }

    await client.query('commit')
    return res.json({ ok: true })
  } catch (error) {
    await client.query('rollback')
    return res.status(500).json({ ok: false, error: error.message })
  } finally {
    client.release()
  }
})

app.get('/api/backoffice/dashboard-ocupacion', async (_req, res) => {
  try {
    const activeEventResult = await pool.query(
      `
      select id
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const eventoId = activeEventResult.rows[0].id

    const [reservasResult, asientosResult] = await Promise.all([
      pool.query('select count(*)::int as total from reservas where evento_id = $1', [eventoId]),
      pool.query(
        `
        select count(*)::int as total
        from asientos a
        join secciones s on s.id = a.seccion_id
        where s.evento_id = $1
        `,
        [eventoId],
      ),
    ])

    const reservados = reservasResult.rows[0].total
    const total = asientosResult.rows[0].total
    const disponibles = Math.max(total - reservados, 0)
    const porcentajeOcupacion = total > 0 ? Number(((reservados / total) * 100).toFixed(2)) : 0

    return res.json({
      ok: true,
      ocupacion: {
        reservados,
        disponibles,
        total,
        porcentajeOcupacion,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/backoffice/export/reservas.csv', async (_req, res) => {
  try {
    const activeEventResult = await pool.query(
      `
      select id, nombre
      from eventos
      where activo = true
      limit 1
      `,
    )

    if (activeEventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const evento = activeEventResult.rows[0]

    const reservationsResult = await pool.query(
      `
      select
        r.id as reserva_id,
        r.documento,
        r.nombre_completo,
        r.nombre,
        r.apellido,
        r.nombre_nino,
        s.nombre as seccion,
        a.fila,
        a.numero as numero_asiento,
        a.codigo_asiento,
        r.created_at as fecha_reserva
      from reservas r
      left join asientos a on a.id = r.asiento_id
      left join secciones s on s.id = a.seccion_id
      where r.evento_id = $1
      order by r.created_at asc
      `,
      [evento.id],
    )

    const headers = [
      'reserva_id',
      'evento',
      'documento',
      'nombre_completo',
      'nombre',
      'apellido',
      'nombre_nino',
      'seccion',
      'fila',
      'numero_asiento',
      'codigo_asiento',
      'fecha_reserva',
    ]

    const lines = [headers.join(',')]

    for (const row of reservationsResult.rows) {
      const values = [
        row.reserva_id,
        evento.nombre,
        row.documento,
        row.nombre_completo,
        row.nombre,
        row.apellido,
        row.nombre_nino,
        row.seccion,
        row.fila,
        row.numero_asiento,
        row.codigo_asiento,
        row.fecha_reserva,
      ]

      lines.push(values.map(escapeCsv).join(','))
    }

    const csv = lines.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="reservas.csv"')

    return res.status(200).send(csv)
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/publico/evento', async (_req, res) => {
  try {
    const eventResult = await pool.query(
      `
      select
        e.id,
        e.nombre,
        e.descripcion,
        e.fecha_evento,
        e.horario,
        e.direccion,
        e.fecha_cierre_reservas,
        coalesce(c.reservas_habilitadas, true) as reservas_habilitadas,
        coalesce(c.max_entradas_por_persona, 1) as max_entradas_por_persona
      from eventos e
      left join configuracion c on c.evento_id = e.id
      where e.activo = true
      limit 1
      `,
    )

    if (eventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'No hay evento activo.' })
    }

    const eventRow = eventResult.rows[0]

    const sectionsResult = await pool.query(
      `
      select id, nombre, orden
      from secciones
      where evento_id = $1
      order by orden asc, nombre asc
      `,
      [eventRow.id],
    )

    return res.json({
      ok: true,
      evento: {
        eventoId: eventRow.id,
        nombreEvento: eventRow.nombre,
        descripcion: eventRow.descripcion || null,
        fechaEvento: eventRow.fecha_evento,
        horario: eventRow.horario || null,
        direccion: eventRow.direccion || null,
        fechaCierreReservas: eventRow.fecha_cierre_reservas,
        reservasHabilitadas: eventRow.reservas_habilitadas,
        maxEntradasPorPersona: eventRow.max_entradas_por_persona,
        sections: sectionsResult.rows.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          orden: item.orden,
        })),
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/publico/secciones/:id/asientos', async (req, res) => {
  const { id } = req.params
  const { eventoId } = req.query

  if (!eventoId || typeof eventoId !== 'string') {
    return res.status(400).json({ ok: false, message: 'eventoId es obligatorio.' })
  }

  try {
    const sectionResult = await pool.query(
      `
      select id
      from secciones
      where id = $1
        and evento_id = $2
      limit 1
      `,
      [id, eventoId],
    )

    if (sectionResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Seccion no encontrada.' })
    }

    const [seatsResult, reservationsResult] = await Promise.all([
      pool.query(
        `
        select id, fila, numero, codigo_asiento
        from asientos
        where seccion_id = $1
        order by fila asc, numero asc
        `,
        [id],
      ),
      pool.query(
        `
        select asiento_id
        from reservas
        where evento_id = $1
        `,
        [eventoId],
      ),
    ])

    const occupiedSet = new Set(reservationsResult.rows.map((item) => item.asiento_id))

    return res.json({
      ok: true,
      asientos: seatsResult.rows.map((seat) => ({
        id: seat.id,
        fila: seat.fila,
        numero: seat.numero,
        codigoAsiento: seat.codigo_asiento,
        reservado: occupiedSet.has(seat.id),
      })),
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/publico/validar-documento', async (req, res) => {
  const { eventoId, documento } = req.query

  if (!eventoId || typeof eventoId !== 'string') {
    return res.status(400).json({ ok: false, message: 'eventoId es obligatorio.' })
  }

  if (!documento || typeof documento !== 'string' || !documento.trim()) {
    return res.status(400).json({ ok: false, message: 'documento es obligatorio.' })
  }

  try {
    const eventResult = await pool.query(
      `
      select e.id, coalesce(c.max_entradas_por_persona, 1) as max_entradas_por_persona
      from eventos e
      left join configuracion c on c.evento_id = e.id
      where e.id = $1
        and e.activo = true
      limit 1
      `,
      [eventoId],
    )

    if (eventResult.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Evento activo no encontrado.' })
    }

    const reservationCountResult = await pool.query(
      `
      select count(*)::int as total
      from reservas
      where evento_id = $1
        and lower(trim(documento)) = lower(trim($2))
      `,
      [eventoId, documento],
    )

    const eventRow = eventResult.rows[0]
    const used = reservationCountResult.rows[0].total
    const limit = Math.max(eventRow.max_entradas_por_persona || 1, 1)
    const canReserve = used < limit

    return res.json({
      ok: true,
      validacion: {
        canReserve,
        used,
        limit,
        message: canReserve
          ? 'Documento habilitado para reservar.'
          : 'El documento ya alcanzo el limite de reservas permitido.',
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/publico/reservas', async (req, res) => {
  const { eventoId, nombreCompleto, nombre, apellido, nombreNino, documento, asientoId } = req.body || {}

  if (!eventoId || typeof eventoId !== 'string') {
    return res.status(400).json({ ok: false, message: 'eventoId es obligatorio.' })
  }

  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    return res.status(400).json({ ok: false, message: 'nombreCompleto es obligatorio.' })
  }

  if (!documento || typeof documento !== 'string') {
    return res.status(400).json({ ok: false, message: 'documento es obligatorio.' })
  }

  if (!asientoId || typeof asientoId !== 'string') {
    return res.status(400).json({ ok: false, message: 'asientoId es obligatorio.' })
  }

  const normalizedNombre = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : null
  const normalizedApellido = typeof apellido === 'string' && apellido.trim() ? apellido.trim() : null
  const normalizedNombreNino =
    typeof nombreNino === 'string' && nombreNino.trim() ? nombreNino.trim() : null

  const client = await pool.connect()

  try {
    await client.query('begin')

    const eventResult = await client.query(
      `
      select
        e.id,
        e.fecha_cierre_reservas,
        coalesce(c.reservas_habilitadas, true) as reservas_habilitadas,
        coalesce(c.max_entradas_por_persona, 1) as max_entradas_por_persona
      from eventos e
      left join configuracion c on c.evento_id = e.id
      where e.id = $1
        and e.activo = true
      limit 1
      `,
      [eventoId],
    )

    if (eventResult.rowCount === 0) {
      await client.query('rollback')
      return res.status(404).json({ ok: false, message: 'Evento activo no encontrado.' })
    }

    const eventRow = eventResult.rows[0]

    if (!eventRow.reservas_habilitadas) {
      await client.query('rollback')
      return res.status(400).json({ ok: false, message: 'Las reservas estan deshabilitadas.' })
    }

    if (new Date(eventRow.fecha_cierre_reservas).getTime() < Date.now()) {
      await client.query('rollback')
      return res.status(400).json({ ok: false, message: 'La reserva esta fuera de horario.' })
    }

    const seatBelongsResult = await client.query(
      `
      select a.id
      from asientos a
      join secciones s on s.id = a.seccion_id
      where a.id = $1
        and s.evento_id = $2
      limit 1
      `,
      [asientoId, eventoId],
    )

    if (seatBelongsResult.rowCount === 0) {
      await client.query('rollback')
      return res.status(400).json({ ok: false, message: 'El asiento no pertenece al evento activo.' })
    }

    const alreadyReservedSeat = await client.query(
      `
      select id
      from reservas
      where evento_id = $1
        and asiento_id = $2
      limit 1
      `,
      [eventoId, asientoId],
    )

    if (alreadyReservedSeat.rowCount > 0) {
      await client.query('rollback')
      return res.status(400).json({ ok: false, message: 'El asiento ya fue reservado.' })
    }

    const reservationsByDocument = await client.query(
      `
      select count(*)::int as total
      from reservas
      where evento_id = $1
        and lower(trim(documento)) = lower(trim($2))
      `,
      [eventoId, documento],
    )

    const usedByDocument = reservationsByDocument.rows[0].total
    const documentLimit = Math.max(eventRow.max_entradas_por_persona || 1, 1)

    if (usedByDocument >= documentLimit) {
      await client.query('rollback')
      return res
        .status(400)
        .json({ ok: false, message: 'El documento ya alcanzo el limite de reservas permitido.' })
    }

    try {
      await client.query(
        `
        insert into reservas (evento_id, asiento_id, nombre_completo, nombre, apellido, nombre_nino, documento)
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          eventoId,
          asientoId,
          nombreCompleto.trim(),
          normalizedNombre,
          normalizedApellido,
          normalizedNombreNino,
          documento.trim(),
        ],
      )
    } catch (insertError) {
      if (insertError?.code !== '42703') {
        throw insertError
      }

      await client.query(
        `
        insert into reservas (evento_id, asiento_id, nombre_completo, documento)
        values ($1, $2, $3, $4)
        `,
        [eventoId, asientoId, nombreCompleto.trim(), documento.trim()],
      )
    }

    await client.query('commit')
    return res.status(201).json({ ok: true })
  } catch (error) {
    await client.query('rollback')
    return res.status(500).json({ ok: false, error: error.message })
  } finally {
    client.release()
  }
})

const port = Number(process.env.API_PORT || 8787)

app.listen(port, () => {
  console.log(`Local API running on http://localhost:${port}`)
})
