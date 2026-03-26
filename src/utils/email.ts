import { Resend } from 'resend'

// Usa un fallback seguro para evitar que Next.js crashee durante el "npm run build" en Vercel si falta la variable
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_build_only')
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function sendCampaignCompletedEmail(userEmail: string, campaignName: string, sentCount: number, failedCount: number) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: `✅ Campaña Completada: ${campaignName}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
          <h2 style="color: #2563eb;">¡Tu campaña ha finalizado con éxito!</h2>
          <p>Te informamos que la campaña <strong>${campaignName}</strong> ha terminado de procesarse.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>📊 Resumen de envío:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="color: #16a34a;"><strong>Enviados exitosamente:</strong> ${sentCount}</li>
              <li style="color: #dc2626;"><strong>Fallidos:</strong> ${failedCount}</li>
            </ul>
          </div>
          <p>Ingresa al dashboard del sistema para ver el reporte detallado y las métricas.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Error sending campaign completed email:', error)
  }
}

export async function sendInstanceDisconnectedEmail(userEmail: string, instanceName: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: `⚠️ Alerta Crítica: Instancia Desconectada (${instanceName})`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 8px; padding: 24px;">
          <h2 style="color: #dc2626;">¡Tu instancia de WhatsApp se ha desconectado!</h2>
          <p>El sistema ha detectado que la instancia <strong>${instanceName}</strong> ha perdido conexión o ha sido bloqueada por WhatsApp.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Acción requerida:</strong> Los envíos automáticos en cola usando esta instancia están paralizados. Ingresa a la sección de Configuración > WhatsApp y vuelve a vincular el dispositivo escaneando el código QR.</p>
          </div>
        </div>
      `
    })
  } catch (error) {
    console.error('Error sending disconnection email:', error)
  }
}
