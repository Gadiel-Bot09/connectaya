'use client'

import { useState, useEffect } from 'react'
import { createInstance, checkInstanceState, getInstanceConnection, deleteInstance, logoutInstance } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Trash2, LogOut, QrCode } from 'lucide-react'

type InstanceType = {
  id: string
  instance_name: string
  display_name: string
  status: string
  phone_number?: string
}

export function InstancesListClient({ initialInstances }: { initialInstances: InstanceType[] }) {
  const [instances, setInstances] = useState(initialInstances)
  const [isCreating, setIsCreating] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [qrCode, setQrCode] = useState<{base64: string, instanceName: string}|null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      instances.forEach(async (inst) => {
        if (inst.status !== 'open') {
          const newStatus = await checkInstanceState(inst.instance_name)
          if (newStatus && newStatus !== inst.status) {
            setInstances(prev => prev.map(p => p.instance_name === inst.instance_name ? { ...p, status: newStatus } : p))
          }
        }
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [instances])

  const handleCreate = async () => {
    if(!newInstanceName.trim()) return
    setIsCreating(true)
    const formData = new FormData()
    formData.append('instanceName', newInstanceName)
    
    const res = await createInstance(formData)
    if (res.error) {
      alert(res.error)
    } else {
      const cleanName = newInstanceName.replace(/\s+/g, '-').toLowerCase()
      // Añadir la instancia a la lista optimísticamente
      setInstances(prev => [{
        id: Math.random().toString(),
        instance_name: cleanName,
        display_name: newInstanceName,
        status: 'connecting'
      }, ...prev])

      setTimeout(async () => {
         const qrRes = await getInstanceConnection(cleanName)
         if (qrRes?.base64) {
           setQrCode({ base64: qrRes.base64, instanceName: cleanName })
         }
      }, 2000)
    }
    setIsCreating(false)
    setNewInstanceName('')
  }
  
  const showQr = async (instanceName: string) => {
     const qrRes = await getInstanceConnection(instanceName)
     if (qrRes?.base64) {
       setQrCode({ base64: qrRes.base64, instanceName })
     } else {
       alert("No hay QR disponible o ya está conectado")
     }
  }

  const handleDelete = async (name: string) => {
    if(confirm('¿Eliminar instancia de forma permanente?')) {
       await deleteInstance(name)
       setInstances(prev => prev.filter(i => i.instance_name !== name))
    }
  }

  const handleLogout = async (name: string) => {
    if(confirm('¿Desconectar WhatsApp en esta instancia?')) {
       await logoutInstance(name)
       setInstances(prev => prev.map(i => i.instance_name === name ? {...i, status: 'close'} : i))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-slate-700">Tus conexiones</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva Instancia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear conexión WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Nombre para identificarla (ej: Ventas, Soporte)" 
                value={newInstanceName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInstanceName(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? 'Creando...' : 'Crear y obtener QR'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {qrCode && (
        <Card className="border-green-200 bg-green-50 shadow-md">
           <CardContent className="flex flex-col items-center py-6">
             <h4 className="font-bold text-lg mb-4 text-green-900">Escanea este código con WhatsApp</h4>
             <img src={qrCode.base64} alt="QR Code" className="w-64 h-64 bg-white p-2 rounded-xl shadow-sm border border-green-100" />
             <p className="mt-4 text-sm text-green-700">Instancia: <span className="font-mono">{qrCode.instanceName}</span></p>
             <p className="text-xs text-green-600 mt-2 text-center max-w-sm">Si el QR caduca o ya escaneaste, cierra esta ventana y el estado se actualizará en breve.</p>
             <Button variant="outline" className="mt-4 border-green-300 text-green-800 hover:bg-green-100" onClick={() => setQrCode(null)}>Cerrar QR</Button>
           </CardContent>
        </Card>
      )}

      {instances.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 border border-dashed rounded-xl text-slate-500">
          No tienes instancias conectadas. Crea una nueva para comenzar.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {instances.map(inst => (
            <Card key={inst.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{inst.display_name}</CardTitle>
                  <Badge variant={inst.status === 'open' ? 'default' : 'secondary'} 
                         className={inst.status === 'open' ? 'bg-green-500' : ''}>
                    {inst.status === 'open' ? 'Conectado' : inst.status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500 mb-4">
                  ID Sistema: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">{inst.instance_name}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {inst.status !== 'open' && (
                     <Button variant="outline" size="sm" onClick={() => showQr(inst.instance_name)}>
                       <QrCode className="w-4 h-4 mr-2" /> Ver QR
                     </Button>
                  )}
                  {inst.status === 'open' && (
                     <Button variant="outline" size="sm" onClick={() => handleLogout(inst.instance_name)}>
                       <LogOut className="w-4 h-4 mr-2" /> Desconectar
                     </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(inst.instance_name)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
