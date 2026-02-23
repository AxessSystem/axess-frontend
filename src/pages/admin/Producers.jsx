import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, CheckCircle, XCircle, Phone, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminProducers() {
  const qc = useQueryClient()

  const { data: producers, isLoading } = useQuery({
    queryKey: ['admin-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select(`
          id, name, business_name, producer_phone, email,
          is_active, commission_rate, created_at,
          events(id)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('producers')
        .update({ is_active: !is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? 'מפיק הושבת' : 'מפיק אושר')
      qc.invalidateQueries(['admin-producers'])
    },
    onError: () => toast.error('שגיאה בעדכון'),
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">מפיקים</h1>
          <p className="text-muted text-sm mt-0.5">{producers?.length || 0} מפיקים במערכת</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> הוסף מפיק
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-surface-50" />
            ))
          : producers?.map((p) => (
              <div key={p.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-wa flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-black text-white">
                    {p.name[0]?.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{p.name}</h3>
                    {p.business_name && (
                      <span className="text-xs text-muted">({p.business_name})</span>
                    )}
                    <span className={p.is_active ? 'badge-green' : 'badge-red'}>
                      {p.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted flex-wrap">
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone size={12} /> {p.producer_phone}
                    </span>
                    {p.email && <span>{p.email}</span>}
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {p.events?.length || 0} אירועים
                    </span>
                    {p.commission_rate && (
                      <span>עמלה: {(p.commission_rate * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive.mutate({ id: p.id, is_active: p.is_active })}
                    disabled={toggleActive.isPending}
                    className={p.is_active ? 'btn-danger text-xs' : 'btn-primary text-xs'}
                  >
                    {p.is_active ? (
                      <><XCircle size={14} /> השבת</>
                    ) : (
                      <><CheckCircle size={14} /> אשר</>
                    )}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
