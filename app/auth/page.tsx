import EmailAuthForm from "@/components/email-auth-form"

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <EmailAuthForm />
      </div>
    </div>
  )
}
