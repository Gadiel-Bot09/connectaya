'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updatePassword } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({
  password: z.string().min(6, 'Debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export function UpdatePasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('password', values.password)
    
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
      
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100/50">
           <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Crear nueva contraseña</h2>
        <p className="text-slate-500 font-medium text-[15px]">Escribe una contraseña segura para tu cuenta.</p>
      </div>

      {success ? (
         <div className="flex flex-col items-center justify-center gap-3 bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-200 animate-in fade-in zoom-in-95">
             <CheckCircle2 className="w-8 h-8 text-emerald-600" />
             <p className="font-bold text-center text-[15px]">¡Contraseña actualizada con éxito!</p>
             <Link href="/login">
               <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl px-8 shadow-md">
                 Iniciar sesión ahora
               </Button>
             </Link>
         </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-slate-700 font-bold block">Nueva Contraseña</Label>
            <Input 
               id="password" 
               type="password" 
               placeholder="••••••••" 
               className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 rounded-xl bg-slate-50/50 font-mono tracking-widest text-lg"
               {...form.register('password')} 
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500 font-medium">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword" className="text-slate-700 font-bold block">Confirmar Contraseña</Label>
            <Input 
               id="confirmPassword" 
               type="password" 
               placeholder="••••••••" 
               className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 rounded-xl bg-slate-50/50 font-mono tracking-widest text-lg"
               {...form.register('confirmPassword')} 
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500 font-medium">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-[14px]">
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
               <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <Button 
               type="submit" 
               className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] rounded-xl shadow-md transition-all active:scale-[0.98]" 
               disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Guardando...</> : 'Actualizar y Entrar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
