'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Debe tener al menos 6 caracteres'),
})

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('password', values.password)
    
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Registro exitoso')
      form.setValue('password', '')
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Comienza Ahora</h2>
        <p className="text-slate-500 font-medium text-[15px]">Crea tu cuenta gratis en 10 segundos.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-slate-700 font-bold block">Correo Electrónico</Label>
          <Input 
             id="email" 
             type="email" 
             placeholder="tu@empresa.com" 
             className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 rounded-xl bg-slate-50/50"
             {...form.register('email')} 
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 font-medium">{form.formState.errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2.5">
           <Label htmlFor="password" className="text-slate-700 font-bold block">Contraseña</Label>
          <Input 
             id="password" 
             type="password" 
             placeholder="••••••••"
             className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 rounded-xl bg-slate-50/50"
             {...form.register('password')} 
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500 font-medium">{form.formState.errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-[14px]">
             <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
             <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center justify-center gap-3 bg-green-50 text-green-800 p-6 rounded-2xl border border-green-200 animate-in fade-in zoom-in-95">
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-6 h-6 text-green-600" />
             </div>
             <p className="font-bold text-center text-[15px]">{success}</p>
             <Link href="/login" className="mt-2 text-green-700 font-bold underline hover:text-green-900">
                Ir a Iniciar Sesión
             </Link>
          </div>
        )}

        {!success && (
          <div className="flex flex-col gap-3 pt-4">
            <Button 
               type="submit" 
               className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] rounded-xl shadow-md transition-all active:scale-[0.98]" 
               disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Creando cuenta...</> : 'Crear Cuenta'}
            </Button>
            
            <p className="text-center text-sm text-slate-500 font-medium mt-6">
               ¿Ya tienes una cuenta? <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">Inicia sesión aquí</Link>
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
