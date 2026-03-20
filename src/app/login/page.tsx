import { LoginForm } from '@/components/auth/login-form'
import { Logo } from '@/components/ui/logo'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative selection:bg-blue-200">
      {/* Sección Izquierda - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Logo variant="dark" className="mb-8" iconClassName="w-12 h-12" textClassName="text-3xl" />
          <h2 className="text-5xl font-bold text-white leading-[1.15] mt-16 mb-6 max-w-xl">
            La plataforma definitiva para escalar tus envíos por WhatsApp.
          </h2>
          <p className="text-blue-100/90 text-[17px] max-w-md leading-relaxed">
            Automatiza tu mensajería, personaliza campañas con Inteligencia Artificial (ChatGPT) y mide el impacto de cada mensaje en tiempo real.
          </p>
        </div>

        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl max-w-md">
            <p className="text-white font-medium mb-4 italic">"ConnectaYa ha transformado la forma en que nos comunicamos con nuestros clientes. Las pausas antibloqueo y la IA son magia pura."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold shadow-sm">JD</div>
              <div>
                <p className="text-white font-bold text-sm">Juan Diego</p>
                <p className="text-blue-200 text-xs font-medium">Director de Marketing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white relative shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-10">
         <div className="w-full max-w-[420px]">
           <div className="lg:hidden flex justify-center mb-10">
             <Logo iconClassName="w-10 h-10" textClassName="text-3xl" />
           </div>
           
           <LoginForm />
         </div>
      </div>
    </div>
  )
}
