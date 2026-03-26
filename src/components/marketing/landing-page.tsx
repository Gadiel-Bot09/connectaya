import Link from 'next/link'
import { ArrowRight, Bot, MapPin, Zap, CheckCircle2, Server, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-200">
      
      {/* Navbar Minimalista */}
      <nav className="absolute top-0 w-full flex items-center justify-between p-6 max-w-7xl mx-auto left-0 right-0 z-50">
        <Logo />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Iniciar sesión</Link>
          <Link href="/register">
             <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full px-6">Empieza Gratis</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center px-4">
        {/* Background Gradients */}
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm mb-8 animate-in slide-in-from-bottom-5 fade-in duration-700">
           <Zap className="w-4 h-4 fill-current"/> El motor B2B más avanzado en LATAM
        </div>

        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-4xl mb-6 leading-[1.1] animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
          Escala tus ventas por WhatsApp en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">piloto automático.</span>
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mb-10 font-medium animate-in slide-in-from-bottom-7 fade-in duration-700 delay-200">
          Encuentra clientes en Google Maps, lanza campañas masivas con IA simulando comportamiento humano, y convierte prospectos de forma segura sin riesgo de bloqueo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
          <Link href="/register">
             <Button className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full px-8 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
               Crear mi cuenta gratis <ArrowRight className="w-5 h-5 ml-2" />
             </Button>
          </Link>
          <Link href="#features">
             <Button variant="outline" className="h-14 font-bold text-lg rounded-full px-8 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
               Descubrir funciones
             </Button>
          </Link>
        </div>

        {/* Dashboard Preview mock */}
        <div className="mt-20 w-full max-w-5xl rounded-3xl border border-slate-200/50 bg-white/50 backdrop-blur-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-500">
           <div className="w-full h-8 bg-slate-100/50 border-b border-slate-200/50 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
           </div>
           <div className="p-2 sm:p-4 opacity-90 grayscale-[20%] hover:grayscale-0 transition-all duration-700">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="w-full h-auto rounded-lg shadow-sm" />
           </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Todo lo que necesitas para tu negocio</h2>
            <p className="text-xl text-slate-500">ConnectaYa junta las mejores herramientas de marketing B2B en un solo lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
               <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3">Maps Scraper B2B</h3>
               <p className="text-slate-500 leading-relaxed font-medium">Encuentra clientes potenciales al instante. Busca negocios en cualquier ciudad del mundo y extrae sus números de WhatsApp con un clic.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
               <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bot className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3">Tecnología Anti-Bloqueo</h3>
               <p className="text-slate-500 leading-relaxed font-medium">Olvida los baneos de número. Nuestro robot simula tipeo humano, pausas automáticas prolongadas e intervalos de descanso 100% parametrizables.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
               <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3">Reportes Profesionales</h3>
               <p className="text-slate-500 leading-relaxed font-medium">Analíticas en tiempo real. Entiende quién recibe tu mensaje, obtén auditorías de fallos y exporta los resultados en hermosos reportes PDF.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planes Section */}
      <section id="planes" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">Acelera tus ventas sin límites</h2>
              <p className="text-xl text-slate-500 font-medium">Elige el plan ideal para automatizar tu negocio hoy mismo.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              {/* Basico */}
              <div className="border border-slate-200 rounded-3xl p-8 bg-white flex flex-col hover:border-blue-200 transition-colors">
                 <h3 className="text-xl font-bold text-slate-600 mb-2">Emprendedor</h3>
                 <p className="text-4xl font-black text-slate-900 mb-1">$49.000 <span className="text-lg text-slate-500 font-medium">/mes</span></p>
                 <p className="text-sm text-slate-500 mb-6 font-medium">Perfecto para negocios que recién comienzan a automatizar.</p>
                 <a href="https://wa.me/573012929983?text=Hola,%20vengo%20de%20la%20página%20web%20y%20quiero%20adquirir%20el%20Plan%20Emprendedor." target="_blank" rel="noreferrer" className="w-full flex justify-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-bold transition-colors mb-8">
                    Adquirir Plan
                 </a>
                 <div className="flex-1 space-y-4">
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> 1 Número de WhatsApp</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> 500 contactos/mes</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> Spintax Nativo Incluido</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> Soporte Básico</p>
                 </div>
              </div>

              {/* Pro (Destacado) */}
              <div className="border-2 border-blue-600 rounded-3xl p-8 bg-blue-50 flex flex-col relative shadow-xl shadow-blue-900/5 transform md:-translate-y-4">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Opción Popular</div>
                 <h3 className="text-xl font-bold text-blue-600 mb-2">Profesional</h3>
                 <p className="text-4xl font-black text-slate-900 mb-1">$99.000 <span className="text-lg text-slate-500 font-medium">/mes</span></p>
                 <p className="text-sm text-slate-500 mb-6 font-medium">Para equipos listos para dominar su mercado.</p>
                 <a href="https://wa.me/573012929983?text=Hola,%20vengo%20de%20la%20página%20web%20y%20quiero%20adquirir%20el%20Plan%20Profesional." target="_blank" rel="noreferrer" className="w-full flex justify-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all mb-8">
                    Adquirir Plan
                 </a>
                 <div className="flex-1 space-y-4">
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0"/> 3 Números de WhatsApp</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0"/> Campañas Ilimitadas</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0"/> Multimensaje IA (GPT-4)</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0"/> Extractor de Google Maps</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-900"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0"/> Soporte Prioritario</p>
                 </div>
              </div>

              {/* Elite */}
              <div className="border border-slate-200 rounded-3xl p-8 bg-slate-900 flex flex-col text-white">
                 <h3 className="text-xl font-bold text-slate-400 mb-2">Élite</h3>
                 <p className="text-4xl font-black text-white mb-1">$199.000 <span className="text-lg text-slate-400 font-medium">/mes</span></p>
                 <p className="text-sm text-slate-400 mb-6 font-medium">Potencia total para agencias y call centers.</p>
                 <a href="https://wa.me/573012929983?text=Hola,%20vengo%20de%20la%20página%20web%20y%20quiero%20adquirir%20el%20Plan%20Élite." target="_blank" rel="noreferrer" className="w-full flex justify-center py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-full font-bold transition-colors mb-8">
                    Adquirir Plan
                 </a>
                 <div className="flex-1 space-y-4">
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-200"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0"/> 10 Números de WhatsApp</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-200"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0"/> Envíos Ultra-Rápidos</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-200"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0"/> Agentes Múltiples (Próximamente)</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-200"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0"/> Integración de API v2</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-slate-200"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0"/> Asesoría de Crecimiento VIP</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-slate-900 py-20 px-6 text-center border-t border-slate-800">
         <h2 className="text-4xl font-black text-white mb-6">¿Listo para dominar tu mercado?</h2>
         <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">Únete a cientos de empresas que ya están automatizando su prospección en WhatsApp.</p>
         <Link href="/register">
             <Button className="h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-full px-10 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
               Comenzar Ahora Mismo
             </Button>
         </Link>
         
         <div className="mt-20 flex items-center justify-center gap-2 text-slate-500 font-medium">
             <svg className="w-5 h-5 text-blue-600 grayscale" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             © {new Date().getFullYear()} ConnectaYa. Todos los derechos reservados.
         </div>
      </footer>
    </div>
  )
}
