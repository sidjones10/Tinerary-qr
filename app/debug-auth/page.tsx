"use client"

import { useAuth } from "@/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugAuthPage() {
  const { user, session, isLoading, loading } = useAuth()

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Loading State:</strong>{" "}
            <Badge variant={isLoading ? "secondary" : "default"}>
              {isLoading ? "Loading..." : "Loaded"}
            </Badge>
          </div>

          <div>
            <strong>User:</strong>{" "}
            <Badge variant={user ? "default" : "destructive"}>
              {user ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>

          <div>
            <strong>User ID:</strong>{" "}
            <code className="bg-muted p-2 rounded">{user?.id || "null"}</code>
          </div>

          <div>
            <strong>User Email:</strong>{" "}
            <code className="bg-muted p-2 rounded">{user?.email || "null"}</code>
          </div>

          <div>
            <strong>Session Exists:</strong>{" "}
            <Badge variant={session ? "default" : "destructive"}>
              {session ? "Yes" : "No"}
            </Badge>
          </div>

          <div className="mt-6">
            <strong>Full User Object:</strong>
            <pre className="bg-muted p-4 rounded mt-2 overflow-auto text-xs">
              {JSON.stringify(user, null, 2) || "null"}
            </pre>
          </div>

          <div className="mt-6">
            <strong>Full Session Object:</strong>
            <pre className="bg-muted p-4 rounded mt-2 overflow-auto text-xs">
              {JSON.stringify(session, null, 2) || "null"}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
