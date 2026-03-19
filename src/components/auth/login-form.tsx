'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { login, signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Debe tener al menos 6 caracteres'),
})

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

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
    
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  async function onRegister() {
    setIsRegistering(true)
    setError(null)
    setSuccess(null)
    const values = form.getValues()
    
    if(!values.email || values.password.length < 6) {
       setError('Por favor, ingresa un correo válido y una contraseña de al menos 6 caracteres.')
       setIsRegistering(false)
       return
    }

    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('password', values.password)
    
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Registro exitoso')
      form.setValue('password', '') // Limpiar la contraseña tras registro
    }
    setIsRegistering(false)
  }

  return (
    <div className="w-full">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Bienvenido de vuelta</h2>
        <p className="text-slate-500 font-medium text-[15px]">Ingresa tus credenciales para acceder a tu panel.</p>
      </div>

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
        
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
             <Label htmlFor="password" className="text-slate-700 font-bold block">Contraseña</Label>
          </div>
          <Input 
             id="password" 
             type="password" 
             placeholder="••••••••"
             className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 rounded-xl bg-slate-50/50"
             {...form.register('password')} 
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500 font-medium">{form.formState.errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-[14px] animate-in fade-in slide-in-from-top-2">
             <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
             <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 text-[14px] animate-in fade-in slide-in-from-top-2">
             <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
             <p className="font-medium leading-relaxed">{success}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button 
             type="submit" 
             className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] rounded-xl shadow-md transition-all active:scale-[0.98]" 
             disabled={isLoading || isRegistering}
          >
            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Abriendo panel...</> : 'Iniciar Sesión'}
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs uppercase font-extrabold tracking-widest">
               <span className="bg-white px-4 text-slate-400">¿Eres nuevo?</span>
            </div>
          </div>
          
          <Button 
             type="button" 
             variant="outline" 
             className="w-full h-12 border-slate-300 text-slate-700 font-bold text-[15px] hover:bg-slate-50 rounded-xl transition-all active:scale-[0.98]" 
             onClick={onRegister} 
             disabled={isLoading || isRegistering}
          >
            {isRegistering ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Registrando...</> : 'Crear Cuenta Nueva'}
          </Button>
        </div>
      </form>
      
      <p className="text-center text-xs text-slate-400 mt-10 font-medium">
         Al registrarte, aceptas nuestros <a href="#" className="underline hover:text-slate-600 transition-colors">Términos</a> y <a href="#" className="underline hover:text-slate-600 transition-colors">Privacidad</a>.
      </p>
    </div>
  )
}
