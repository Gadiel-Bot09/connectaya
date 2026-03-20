'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { resetPassword } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
})

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData()
    formData.append('email', values.email)
    
    const result = await resetPassword(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Correo enviado')
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      
      <div className="mb-6">
        <Link href="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6">
           <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Login
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Recuperar contraseña</h2>
        <p className="text-slate-500 font-medium text-[15px]">Ingresa tu correo y te enviaremos un enlace mágico para restaurarla.</p>
      </div>

      {success ? (
         <div className="flex flex-col items-center justify-center gap-3 bg-green-50 text-green-800 p-6 rounded-2xl border border-green-200 mt-8">
             <CheckCircle2 className="w-8 h-8 text-green-600" />
             <p className="font-bold text-center text-[15px]">{success}</p>
         </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-slate-700 font-bold block">Correo Electrónico</Label>
            <Input 
               id="email" 
               type="email" 
               placeholder="tu@empresa.com" 
               className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 rounded-xl bg-slate-50/50"
               {...form.register('email')} 
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 font-medium">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-[14px]">
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
               <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <Button 
               type="submit" 
               className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] rounded-xl shadow-md transition-all active:scale-[0.98]" 
               disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Enviando enlace...</> : 'Enviar correo de recuperación'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
