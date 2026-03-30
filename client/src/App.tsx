import { Handle, Position } from 'reactflow'
import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  type Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toPng } from 'html-to-image'
import './App.css'

// function TableNode({ data }: { data: any }) {
//   const [hoveredCol, setHoveredCol] = useState<string | null>(null)

//   return (
//     <div className="table-node">
//       <div className="table-name">{data.label}</div>
//       {data.columns.map((col: any) => (
//         <div
//           key={col.name}
//           className={`table-col ${col.isFk ? 'fk-col' : ''} ${hoveredCol === col.name ? 'hovered' : ''}`}
//           onMouseEnter={() => setHoveredCol(col.name)}
//           onMouseLeave={() => setHoveredCol(null)}
//         >
//           <span className="col-name">
//             {col.isFk && <span className="fk-badge">FK</span>}
//             {col.isPk && <span className="pk-badge">PK</span>}
//             {col.name}
//           </span>
//           <span className="col-type">{col.type}</span>
//         </div>
//       ))}
//     </div>
//   )
// }

function TableNode({ data }: { data: any }) {
  const [hoveredCol, setHoveredCol] = useState<string | null>(null)

  return (
    <div className="table-node">
      <Handle type="target" position={Position.Top} style={{ background: '#3dffa0', border: 'none' }} />
      <div className="table-name">{data.label}</div>
      {data.columns.map((col: any) => (
        <div
          key={col.name}
          className={`table-col ${col.isFk ? 'fk-col' : ''} ${hoveredCol === col.name ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCol(col.name)}
          onMouseLeave={() => setHoveredCol(null)}
        >
          <span className="col-name">
            {col.isFk && <span className="fk-badge">FK</span>}
            {col.isPk && <span className="pk-badge">PK</span>}
            {col.name}
          </span>
          <span className="col-type">{col.type}</span>
        </div>
      ))}
      <Handle type="source" position={Position.Bottom} style={{ background: '#3dffa0', border: 'none' }} />
    </div>
  )
}
const nodeTypes = { tableNode: TableNode }

function buildGraph(data: any) {
  const fkColumns = new Set(
    data.relationships.map((r: any) => `${r.table_name}.${r.column_name}`)
  )

  const nodes: Node[] = data.tables.map((table: any, i: number) => ({
    id: table.name,
    type: 'tableNode',
    position: { x: (i % 3) * 340 + 50, y: Math.floor(i / 3) * 320 + 50 },
    data: {
      label: table.name,
      columns: table.columns.map((col: any) => ({
        ...col,
        isFk: fkColumns.has(`${table.name}.${col.name}`),
        isPk: col.name === 'id',
      })),
    },
    style: {
      width: 300,
      padding: 0,
      borderRadius: 8,
      border: '1px solid #2a3333',
      background: '#161a1a',
    },
  }))

  const edges: Edge[] = data.relationships.map((rel: any, i: number) => ({
    id: `e${i}`,
    source: rel.table_name,
    target: rel.foreign_table,
    label: `${rel.column_name} → ${rel.foreign_column}`,
    animated: true,
    style: { stroke: '#3dffa0' },
    labelStyle: { fill: '#8fa0a0', fontSize: 10 },
    labelBgStyle: { fill: '#161a1a' },
  }))

  return { nodes, edges }
}

function Flow() {
  const [connectionString, setConnectionString] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [connected, setConnected] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { fitView } = useReactFlow()
  const flowRef = useRef<HTMLDivElement>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  async function handleConnect() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3001/api/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const { nodes, edges } = buildGraph(data)
      setNodes(nodes)
      setEdges(edges)
      setConnected(true)
      setTimeout(() => fitView({ padding: 0.2 }), 50)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(val: string) {
    setSearch(val)
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        style: {
          ...n.style,
          opacity: val === '' || n.id.toLowerCase().includes(val.toLowerCase()) ? 1 : 0.2,
          border: val !== '' && n.id.toLowerCase().includes(val.toLowerCase())
            ? '1px solid #3dffa0'
            : '1px solid #2a3333',
        },
      }))
    )
  }

  async function handleExport() {
    if (!flowRef.current) return
    const dataUrl = await toPng(flowRef.current, { backgroundColor: '#0d0f0f' })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'dbviz-schema.png'
    a.click()
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="logo">⬡ dbviz</div>
        <div className="input-row">
          <input
            className="conn-input"
            type="text"
            placeholder="postgresql://user:password@localhost:5432/mydb"
            value={connectionString}
            onChange={e => setConnectionString(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
          />
          <button className="conn-btn" onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
        {connected && (
          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            <button className="export-btn" onClick={handleExport}>
              ↓ Export PNG
            </button>
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>

      <div className="canvas" ref={flowRef}>
        {!connected ? (
          <div className="empty">
            <div className="empty-icon">⬡</div>
            <div className="empty-text">Paste a connection string above to visualize your schema</div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#2a3333" gap={24} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}