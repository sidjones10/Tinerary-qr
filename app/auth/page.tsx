import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppHeader } from "@/components/app-header"

export default async function DashboardPage() {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to auth page
  if (!session) {
    redirect("/auth?redirectTo=/dashboard")
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your travel planning hub.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Itineraries</CardTitle>
              <CardDescription>View and manage your travel plans</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Active itineraries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved Places</CardTitle>
              <CardDescription>Places you want to visit</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Saved destinations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared with Me</CardTitle>
              <CardDescription>Itineraries shared by friends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Shared itineraries</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with planning your next trip</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/create"
                className="block p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <h3 className="font-semibold mb-1">Create New Itinerary</h3>
                <p className="text-sm opacity-90">Start planning your next adventure</p>
              </a>
              <a
                href="/explore"
                className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <h3 className="font-semibold mb-1">Explore Destinations</h3>
                <p className="text-sm text-gray-600">Discover new places to visit</p>
              </a>
            </CardContent>
          </Card>
        </div>

        {userData && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  {userData.phone && (
                    <div>
                      <dt className="text-sm text-gray-500">Phone</dt>
                      <dd className="font-medium">{userData.phone}</dd>
                    </div>
                  )}
                  {userData.email && (
                    <div>
                      <dt className="text-sm text-gray-500">Email</dt>
                      <dd className="font-medium">{userData.email}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-gray-500">Member Since</dt>
                    <dd className="font-medium">
                      {new Date(userData.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
