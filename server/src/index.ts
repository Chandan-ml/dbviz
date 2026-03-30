import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/schema', async (req, res) => {
  const { connectionString } = req.body

  if (!connectionString) {
    return res.status(400).json({ error: 'Connection string is required' })
  }

  const pool = new Pool({ connectionString, ssl: false })

  try {
    // Get all tables and columns
    const columnsResult = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `)

    // Get all foreign key relationships
    const fkResult = await pool.query(`
      SELECT
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `)

    // Group columns by table
    const tables: Record<string, any> = {}
    for (const row of columnsResult.rows) {
      if (!tables[row.table_name]) {
        tables[row.table_name] = { name: row.table_name, columns: [] }
      }
      tables[row.table_name].columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
      })
    }

    await pool.end()

    res.json({
      tables: Object.values(tables),
      relationships: fkResult.rows,
    })
  } catch (err: any) {
    await pool.end()
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => {
  console.log('dbviz server running on http://localhost:3001')
})
