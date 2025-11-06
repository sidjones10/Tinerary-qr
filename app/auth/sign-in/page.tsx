import { redirect } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SignInForm } from "@/components/auth/sign-in-form"

export default async function SignIn() {
  const supabase = createClient()

  // Check if user is already signed in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there is a session, redirect to the dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">Sign in to your account</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <SignInForm />
        </div>
      </div>
    </div>
  )
}
