"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Loader2, AlertCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/profile-settings"
import { getUserDrafts, type EventDraft } from "@/app/actions/draft-actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [itineraries, setItineraries] = useState([])
  const [drafts, setDrafts] = useState<EventDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load user profile and data
  async function loadProfile() {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch user's itineraries
      try {
        const { data: userItineraries, error: itinerariesError } = await supabase
          .from("itineraries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (itinerariesError) {
          console.error("Error fetching itineraries:", itinerariesError)
          setError(`Failed to load itineraries: ${itinerariesError.message}`)
        } else {
          setItineraries(userItineraries || [])
        }
      } catch (itinerariesErr: any) {
        console.error("Exception fetching itineraries:", itinerariesErr)
        setError(`Unexpected error loading itineraries: ${itinerariesErr.message}`)
      }

      // Fetch user's drafts
      try {
        const { success, drafts: userDrafts, error: draftsError } = await getUserDrafts()

        if (success && userDrafts) {
          setDrafts(userDrafts)
        } else if (draftsError) {
          console.error("Error fetching drafts:", draftsError)
        }
      } catch (draftsErr) {
        console.error("Exception fetching drafts:", draftsErr)
      }
    } catch (err: any) {
      console.error("Error loading profile:", err)
      setError(`Profile loading error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 bg-background">
          <div className="container px-4 py-6 md:py-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="itineraries" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="itineraries">My Itineraries</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="itineraries">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : itineraries.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {itineraries.map((itinerary: any) => (
                        <Card key={itinerary.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xl">{itinerary.title}</CardTitle>
                            <CardDescription>{new Date(itinerary.created_at).toLocaleDateString()}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {itinerary.description || "No description provided"}
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/event/${itinerary.id}`)}>
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Itineraries Yet</CardTitle>
                        <CardDescription>
                          You haven't created any itineraries yet. Create your first one now!
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button onClick={() => router.push("/create")}>Create Itinerary</Button>
                      </CardFooter>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="drafts">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : drafts.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {drafts.map((draft) => (
                        <Card key={draft.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xl">{draft.title || "Untitled Draft"}</CardTitle>
                            <CardDescription>
                              {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {draft.description || "No description provided"}
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/create?draft=${draft.id}`)}
                              className="mr-2"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                // Delete draft logic would go here
                                // After deletion, refresh the list
                                loadProfile()
                              }}
                            >
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Drafts</CardTitle>
                        <CardDescription>
                          You don't have any saved drafts. Start creating a new itinerary!
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button onClick={() => router.push("/create")}>Create New</Button>
                      </CardFooter>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="settings">
                  <ProfileSettings />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
