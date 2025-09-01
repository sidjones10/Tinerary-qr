"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, SearchIcon } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase-client"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(query)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({
    itineraries: [],
    destinations: [],
    users: [],
  })
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return

    setLoading(true)

    try {
      // Search itineraries
      const { data: itineraries, error: itinerariesError } = await supabase
        .from("itineraries")
        .select("*")
        .or(`title.ilike.%${searchTerm}%,destination.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(10)

      if (itinerariesError) {
        console.error("Error searching itineraries:", itinerariesError)
      }

      // For demonstration, we'll use the same data for destinations
      // In a real app, you would have a separate destinations table
      const { data: destinations, error: destinationsError } = await supabase
        .from("itineraries")
        .select("destination")
        .ilike("destination", `%${searchTerm}%`)
        .limit(10)

      if (destinationsError) {
        console.error("Error searching destinations:", destinationsError)
      }

      // Search users (if you have a users table)
      // This is a simplified example
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10)

      if (usersError) {
        console.error("Error searching users:", usersError)
      }

      setResults({
        itineraries: itineraries || [],
        destinations: destinations || [],
        users: users || [],
      })
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Update URL with search query
      const url = new URL(window.location.href)
      url.searchParams.set("q", searchQuery)
      window.history.pushState({}, "", url)

      performSearch(searchQuery)
    }
  }

  const getTotalResults = () => {
    return results.itineraries.length + results.destinations.length + results.users.length
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background">
        <div className="container px-4 py-6 md:py-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Search</h1>

            <form onSubmit={handleSearch} className="relative mb-8">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for itineraries, destinations, users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="sr-only">
                Search
              </Button>
            </form>

            {query && (
              <div className="mb-6">
                <h2 className="text-lg font-medium">{loading ? "Searching..." : `Search results for "${query}"`}</h2>
                {!loading && <p className="text-sm text-muted-foreground">Found {getTotalResults()} results</p>}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-muted-foreground">Searching...</p>
              </div>
            ) : query && getTotalResults() === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">No results found</h3>
                <p className="text-muted-foreground">Try searching for something else</p>
              </div>
            ) : query ? (
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="itineraries">Itineraries</TabsTrigger>
                  <TabsTrigger value="destinations">Destinations</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  {results.itineraries.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4">Itineraries</h3>
                      <div className="space-y-4">
                        {results.itineraries.map((itinerary) => (
                          <Card key={itinerary.id}>
                            <CardContent className="p-4">
                              <h4 className="font-medium">{itinerary.title || "Untitled Itinerary"}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{itinerary.destination}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => (window.location.href = `/itinerary/${itinerary.id}`)}
                              >
                                View Itinerary
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.destinations.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4">Destinations</h3>
                      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                        {results.destinations.map((item, index) => (
                          <Card key={index}>
                            <CardContent className="p-4 text-center">
                              <h4 className="font-medium">{item.destination}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  (window.location.href = `/search?q=${encodeURIComponent(item.destination)}`)
                                }
                              >
                                Explore
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Users</h3>
                      <div className="space-y-4">
                        {results.users.map((user) => (
                          <Card key={user.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                              </div>
                              <div>
                                <h4 className="font-medium">{user.name || "User"}</h4>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="itineraries" className="mt-0">
                  {results.itineraries.length > 0 ? (
                    <div className="space-y-4">
                      {results.itineraries.map((itinerary) => (
                        <Card key={itinerary.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{itinerary.title || "Untitled Itinerary"}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{itinerary.destination}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => (window.location.href = `/itinerary/${itinerary.id}`)}
                            >
                              View Itinerary
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No itineraries found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="destinations" className="mt-0">
                  {results.destinations.length > 0 ? (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {results.destinations.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 text-center">
                            <h4 className="font-medium">{item.destination}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() =>
                                (window.location.href = `/search?q=${encodeURIComponent(item.destination)}`)
                              }
                            >
                              Explore
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No destinations found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
