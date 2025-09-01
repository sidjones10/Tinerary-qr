import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Authentication Error
          </CardTitle>
          <CardDescription>There was a problem with your authentication link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              The authentication link is invalid or has expired. This can happen if:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The link has already been used</li>
                <li>The link has expired</li>
                <li>The link was corrupted</li>
              </ul>
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth">Back to Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth?tab=forgot">Request New Reset Link</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
