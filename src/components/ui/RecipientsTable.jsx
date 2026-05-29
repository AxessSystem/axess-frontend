import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useState, useMemo, useRef, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Pencil, Trash2, ExternalLink } from 'lucide-react'

export default function RecipientsTable({
  recipients,
  onQuickEdit,
  onDelete,
  onNavigate,
  contactTypes = [],
  selectedIds = new Set(),
  onSelectionChange,
}) {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [openFilterCol, setOpenFilterCol] = useState(null)
  const filterRef = useRef(null)
  const [tablePageIndex, setTablePageIndex] = useState(0)
  const TABLE_PAGE_SIZE = 100

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenFilterCol(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const columns = useMemo(() => [
    {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          style={{ accentColor: '#00C37A', cursor: 'pointer' }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          style={{ accentColor: '#00C37A', cursor: 'pointer' }}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'name',
      header: 'שם',
      size: 180,
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#00C37A30', color: '#00C37A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 600, flexShrink: 0,
          }}
          >
            {(row.original.name || '?')[0]}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            {row.original.name || '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'טלפון',
      size: 130,
      cell: ({ getValue }) => (
        <span style={{ fontSize: '13px', direction: 'ltr', display: 'block' }}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'אימייל',
      size: 180,
      cell: ({ getValue }) => (
        <span style={{ fontSize: '13px', direction: 'ltr', display: 'block' }}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'מין',
      size: 80,
      cell: ({ getValue }) => {
        const g = getValue()
        return (
          <span style={{ fontSize: '13px' }}>
            {g === 'Female' ? '👩 נקבה' : g === 'Male' ? '👨 זכר' : '—'}
          </span>
        )
      },
    },
    {
      id: 'age',
      header: 'גיל',
      size: 70,
      accessorFn: row => (row.birth_date
        ? new Date().getFullYear() - new Date(row.birth_date).getFullYear()
        : null),
      cell: ({ getValue }) => (
        <span style={{ fontSize: '13px' }}>{getValue() ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Score',
      size: 80,
      cell: ({ getValue }) => (
        <span style={{
          fontSize: '12px', fontWeight: 600,
          color: getValue() > 50 ? '#00C37A' : 'var(--text-secondary)',
        }}
        >
          {getValue() || 0}
        </span>
      ),
    },
    {
      accessorKey: 'contact_types',
      header: 'סוג קשר',
      size: 150,
      enableSorting: false,
      cell: ({ getValue }) => {
        const types = getValue() || []
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {types.slice(0, 2).map(t => {
              const def = contactTypes.find(ct => ct.value === t)
              return (
                <span key={t} style={{
                  fontSize: '11px', padding: '2px 6px',
                  borderRadius: '10px', background: '#00C37A20',
                  color: '#00C37A',
                }}
                >
                  {def?.emoji} {def?.label || t}
                </span>
              )
            })}
            {types.length > 2 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                +{types.length - 2}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'tags',
      header: 'תגיות',
      size: 160,
      enableSorting: false,
      cell: ({ getValue }) => {
        const tags = getValue() || []
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {tags.slice(0, 2).map(tag => (
              <span key={tag} style={{
                fontSize: '11px', padding: '2px 6px',
                borderRadius: '10px', background: 'var(--bg)',
                border: '1px solid var(--border)', color: 'var(--text-secondary)',
              }}
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                +{tags.length - 2}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'internal_notes',
      header: 'הערות',
      size: 180,
      cell: ({ getValue }) => (
        <span style={{
          fontSize: '12px', color: 'var(--text-secondary)',
          display: 'block', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '160px',
        }}
        >
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'segment',
      header: 'סגמנט',
      size: 100,
      cell: ({ getValue }) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'last_seen',
      header: 'פעיל לאחרונה',
      size: 130,
      cell: ({ getValue }) => {
        const d = getValue()
        if (!d) return <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>—</span>
        const date = new Date(d)
        return (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {date.toLocaleDateString('he-IL')}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'פעולות',
      size: 110,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { sticky: true },
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onQuickEdit(row.original) }}
            title="עריכה מהירה"
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '4px 6px', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '12px',
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onNavigate(row.original.id) }}
            title="פרופיל מלא"
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '4px 6px', cursor: 'pointer',
              color: '#00C37A', fontSize: '12px',
            }}
          >
            <ExternalLink size={12} />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(row.original) }}
            title="מחק"
            style={{
              background: 'none', border: '1px solid #ef444440',
              borderRadius: '6px', padding: '4px 6px', cursor: 'pointer',
              color: '#ef4444', fontSize: '12px',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ], [contactTypes, onQuickEdit, onDelete, onNavigate])

  const rowSelection = useMemo(() => {
    const sel = {}
    recipients.forEach((r) => {
      if (selectedIds.has(r.id)) sel[r.id] = true
    })
    return sel
  }, [selectedIds, recipients])

  const table = useReactTable({
    data: recipients,
    getRowId: row => row.id,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex: tablePageIndex, pageSize: TABLE_PAGE_SIZE },
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: updater => {
      const next = typeof updater === 'function'
        ? updater({ pageIndex: tablePageIndex, pageSize: TABLE_PAGE_SIZE })
        : updater
      setTablePageIndex(next.pageIndex)
    },
    onRowSelectionChange: (updater) => {
      const newSel = typeof updater === 'function' ? updater(rowSelection) : updater
      const newSelectedIds = new Set(
        Object.keys(newSel).filter(id => newSel[id]),
      )
      onSelectionChange?.(newSelectedIds)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  })

  const getUniqueValues = (colId) => {
    const vals = new Set()
    recipients.forEach(r => {
      const v = r[colId]
      if (Array.isArray(v)) v.forEach(x => vals.add(x))
      else if (v != null && v !== '') vals.add(String(v))
    })
    return [...vals].slice(0, 50)
  }

  return (
    <div style={{ position: 'relative', overflowX: 'auto', direction: 'rtl' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '14px', direction: 'rtl',
      }}
      >
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const isSticky = header.column.columnDef.meta?.sticky
                const currentFilter = header.column.getFilterValue()

                return (
                  <th
                    key={header.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--card)',
                      borderBottom: '2px solid var(--border)',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      width: header.column.columnDef.size,
                      minWidth: header.column.columnDef.size,
                      ...(isSticky ? {
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
                      } : {}),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between' }}>
                      <span
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ArrowUp size={12} />}
                        {header.column.getIsSorted() === 'desc' && <ArrowDown size={12} />}
                        {header.column.getCanSort() && !header.column.getIsSorted() && (
                          <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
                        )}
                      </span>

                      {header.column.getCanFilter() && (
                        <div style={{ position: 'relative' }} ref={openFilterCol === header.id ? filterRef : null}>
                          <button
                            type="button"
                            onClick={() => setOpenFilterCol(p => (p === header.id ? null : header.id))}
                            style={{
                              background: currentFilter ? '#00C37A20' : 'none',
                              border: currentFilter ? '1px solid #00C37A' : '1px solid transparent',
                              borderRadius: '4px', padding: '2px 4px', cursor: 'pointer',
                              color: currentFilter ? '#00C37A' : 'var(--text-secondary)',
                              fontSize: '10px',
                            }}
                          >
                            <ChevronDown size={10} />
                          </button>

                          {openFilterCol === header.id && (
                            <div style={{
                              position: 'absolute', top: '100%', right: 0,
                              background: 'var(--card)', border: '1px solid var(--border)',
                              borderRadius: '10px', padding: '10px',
                              zIndex: 100, minWidth: '180px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              maxHeight: '280px', overflowY: 'auto',
                            }}
                            >
                              <input
                                placeholder="חפש..."
                                value={(header.column.getFilterValue() || '')}
                                onChange={e => header.column.setFilterValue(e.target.value || undefined)}
                                style={{
                                  width: '100%', padding: '6px 10px',
                                  background: 'var(--bg)', border: '1px solid var(--border)',
                                  borderRadius: '6px', color: 'var(--text)',
                                  fontSize: '13px', direction: 'rtl',
                                  marginBottom: '8px',
                                }}
                                autoFocus
                              />

                              {getUniqueValues(header.column.id).map(val => (
                                <label
                                  key={val}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '4px', cursor: 'pointer', fontSize: '12px',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={currentFilter === val}
                                    onChange={() => header.column.setFilterValue(
                                      currentFilter === val ? undefined : val,
                                    )}
                                    style={{ accentColor: '#00C37A' }}
                                  />
                                  {val}
                                </label>
                              ))}

                              {currentFilter && (
                                <button
                                  type="button"
                                  onClick={() => { header.column.setFilterValue(undefined); setOpenFilterCol(null) }}
                                  style={{
                                    marginTop: '8px', width: '100%', padding: '5px',
                                    borderRadius: '6px', border: '1px solid var(--border)',
                                    background: 'transparent', color: '#ef4444',
                                    cursor: 'pointer', fontSize: '12px',
                                  }}
                                >
                                  נקה פילטר
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                background: row.getIsSelected() ? '#00C37A10' : i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!row.getIsSelected()) e.currentTarget.style.background = 'var(--border)' }}
              onMouseLeave={e => {
                e.currentTarget.style.background = row.getIsSelected() ? '#00C37A10' : i % 2 === 0 ? 'var(--card)' : 'var(--bg)'
              }}
            >
              {row.getVisibleCells().map(cell => {
                const isSticky = cell.column.columnDef.meta?.sticky
                return (
                  <td
                    key={cell.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border)',
                      verticalAlign: 'middle',
                      ...(isSticky ? {
                        position: 'sticky',
                        left: 0,
                        background: row.getIsSelected() ? '#00C37A10' : i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                        zIndex: 2,
                        boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
                      } : {}),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {table.getRowModel().rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          אין תוצאות
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        direction: 'rtl', flexWrap: 'wrap', gap: '8px',
      }}
      >
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {table.getFilteredRowModel().rows.length} רשומות סה&quot;כ
          {selectedIds.size > 0 && ` | ${selectedIds.size} נבחרו`}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setTablePageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed', opacity: table.getCanPreviousPage() ? 1 : 0.4, color: 'var(--text)', fontSize: '13px' }}
          >
            «
          </button>
          <button
            type="button"
            onClick={() => setTablePageIndex(p => p - 1)}
            disabled={!table.getCanPreviousPage()}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed', opacity: table.getCanPreviousPage() ? 1 : 0.4, color: 'var(--text)', fontSize: '13px' }}
          >
            ‹ הקודם
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>
            {tablePageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            type="button"
            onClick={() => setTablePageIndex(p => p + 1)}
            disabled={!table.getCanNextPage()}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed', opacity: table.getCanNextPage() ? 1 : 0.4, color: 'var(--text)', fontSize: '13px' }}
          >
            הבא ›
          </button>
          <button
            type="button"
            onClick={() => setTablePageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed', opacity: table.getCanNextPage() ? 1 : 0.4, color: 'var(--text)', fontSize: '13px' }}
          >
            »
          </button>
        </div>
      </div>
    </div>
  )
}
