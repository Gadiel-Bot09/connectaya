import { RegisterForm } from '@/components/auth/register-form'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative selection:bg-blue-200">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white relative z-10">
         <div className="w-full max-w-[420px]">
           <RegisterForm />
         </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-800 via-blue-700 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center h-full justify-center">
            <h2 className="text-5xl font-bold text-white leading-[1.15] text-center max-w-xl">
              Únete a la revolución de las ventas automatizadas B2B.
            </h2>
        </div>
      </div>
    </div>
  )
}
