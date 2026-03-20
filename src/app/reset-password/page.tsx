import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative selection:bg-blue-200">
      <div className="w-full flex items-center justify-center p-6 bg-white relative z-10">
         <div className="w-full max-w-[420px]">
           <ResetPasswordForm />
         </div>
      </div>
    </div>
  )
}
