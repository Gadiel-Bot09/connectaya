'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Key, AlertCircle, Clock, Zap } from 'lucide-react'
import { redeemCode } from '../actions'

export function BillingClient({ profile, plan, instancesCount }: { profile: any, plan: any, instancesCount: number }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await redeemCode(code)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success) {
        setSuccess(res.message || 'Código canjeado correctamente.')
        setCode('')
      }
    } catch (err: any) {
      setError('Error de conexión al canjear el código.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate days left
  let daysLeft = 0
  let isExpired = false
  if (profile?.license_expires_at) {
    const expiryDate = new Date(profile.license_expires_at)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) {
       isExpired = true
       daysLeft = 0
    }
  }
  
  const hasActivePlan = plan && !isExpired

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Current Plan Card */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg font-bold flex justify-between items-center">
            Mi Plan Actual
            {hasActivePlan ? (
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Activo</span>
            ) : (
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">Inactivo / Expirado</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {hasActivePlan ? (
            <div className="space-y-6">
               <div>
                  <h3 className="text-3xl font-black text-blue-600">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 font-medium">
                     <Clock className="w-4 h-4" /> 
                     Expira en {daysLeft} días ({(new Date(profile.license_expires_at)).toLocaleDateString('es-CO')})
                  </p>
               </div>

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-slate-700">Instancias de WhatsApp</span>
                     <span className="text-xs font-medium text-slate-500">{instancesCount} / {plan.max_instances} usadas</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                     <div 
                       className={`h-2 rounded-full ${instancesCount >= plan.max_instances ? 'bg-amber-500' : 'bg-blue-600'}`} 
                       style={{ width: `${Math.min(100, (instancesCount / plan.max_instances) * 100)}%` }}
                     ></div>
                  </div>
                  {instancesCount >= plan.max_instances && (
                     <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3"/> Has alcanzado el límite de tu plan actual.
                     </p>
                  )}
               </div>

               <div className="space-y-2">
                 <p className="text-sm font-bold text-slate-700 mb-2">Beneficios Incluidos:</p>
                 {(plan.features || []).map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {feat}
                    </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="text-center py-6">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Zap className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">No tienes un plan activo</h3>
               <p className="text-sm text-slate-500 font-medium mb-6">Tu cuenta está limitada. Para conectar WhatsApps y enviar campañas, redime un Código de Activación.</p>
               <a href="https://wa.me/573012929983?text=Hola,%20quiero%20adquirir%20un%20plan%20para%20ConnectaYa." target="_blank" rel="noreferrer" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors">
                  Contactar Ventas
               </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Code Form */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-blue-50/30 pb-4">
          <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Canjear Código
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleRedeem} className="space-y-4">
            <p className="text-sm text-slate-600 font-medium mb-4">
              Si compraste una licencia por WhatsApp, ingresa el código alfanumérico aquí para activar tu acceso instantáneamente.
            </p>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Código de Activación</Label>
              <Input 
                placeholder="Ejemplo: CNX-PRO-9XF2" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase tracking-wider text-center text-lg h-12"
                disabled={loading}
                required
              />
            </div>

            {error && (
               <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
               </div>
            )}
            
            {success && (
               <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
               </div>
            )}

            <Button type="submit" disabled={loading || !code} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors">
              {loading ? 'Validando código...' : 'Activar mi cuenta'}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-xl">
             <h4 className="font-bold text-slate-700 text-sm mb-1">¿Cómo obtengo un código?</h4>
             <p className="text-xs text-slate-500 font-medium">Los códigos de activación son vendidos directamente por un asesor comercial autorizado. <a href="https://wa.me/573012929983" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">Haz clic aquí para chatear con ventas.</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
