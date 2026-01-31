"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, Filter, Calendar, MapPin, User, ArrowLeft, Loader2 } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { searchContent, getPopularSearches, type SearchResults } from "@/lib/search-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "itinerary" | "user">("all")
  const [locationFilter, setLocationFilter] = useState<string>("")

  useEffect(() => {
    const loadPopularSearches = async () => {
      const searches = await getPopularSearches()
      setPopularSearches(searches)
    }
    loadPopularSearches()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    }
  }, [searchQuery, activeTab, locationFilter])

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const filters: any = {}
      if (activeTab !== "all") {
        filters.type = activeTab
      }
      if (locationFilter) {
        filters.location = locationFilter
      }

      const searchResults = await searchContent(searchQuery, filters)
      setResults(searchResults)
    } catch (error) {
      console.error("Error performing search:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
  }

  const handlePopularSearch = (search: string) => {
    setQuery(search)
    setSearchQuery(search)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const renderItineraryCard = (item: any) => {
    const startDate = new Date(item.start_date)
    const endDate = new Date(item.end_date)
    const isTrip = startDate.toDateString() !== endDate.toDateString()

    return (
      <Link href={`/event/${item.id}`} key={item.id}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <div className="relative h-48">
            <Image
              src={item.image_url || "/placeholder.svg?height=400&width=600"}
              alt={item.title}
              fill
              className="object-cover"
            />
            <Badge className="absolute top-2 left-2 bg-violet-500">{isTrip ? "Trip" : "Event"}</Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
            {item.location && (
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span className="line-clamp-1">{item.location}</span>
              </div>
            )}
            {item.start_date && (
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>
                  {formatDate(item.start_date)}
                  {item.end_date && item.start_date !== item.end_date && ` - ${formatDate(item.end_date)}`}
                </span>
              </div>
            )}
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
            )}
            {item.username && (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-violet-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (item.user_id) {
                    router.push(`/user/${item.user_id}`)
                  }
                }}
              >
                <User className="h-3.5 w-3.5" />
                <span>@{item.username}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderUserCard = (item: any) => {
    return (
      <Link href={`/user/${item.id}`} key={item.id}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={item.avatar_url || "/placeholder.svg"} alt={item.name || item.username} />
                <AvatarFallback className="bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xl">
                  {(item.name || item.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name || item.username}</h3>
                {item.username && <p className="text-sm text-muted-foreground">@{item.username}</p>}
                {item.bio && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.bio}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background">
        <div className="container px-4 py-6 md:py-10">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Search</h1>

            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search events, trips, places, or users..."
                    className="pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </div>
            </form>

            {!searchQuery && popularSearches.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">Popular Searches</h2>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((search) => (
                    <Badge
                      key={search}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handlePopularSearch(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && (
              <>
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Results for "{searchQuery}"
                      {results && <span className="text-muted-foreground ml-2">({results.totalCount})</span>}
                    </h2>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : results && results.totalCount > 0 ? (
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList>
                      <TabsTrigger value="all">
                        All ({results.itineraries.length + results.users.length})
                      </TabsTrigger>
                      <TabsTrigger value="itinerary">Itineraries ({results.itineraries.length})</TabsTrigger>
                      <TabsTrigger value="user">Users ({results.users.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-6 mt-6">
                      {results.itineraries.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Itineraries</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.itineraries.map(renderItineraryCard)}
                          </div>
                        </div>
                      )}

                      {results.users.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Users</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.users.map(renderUserCard)}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="itinerary" className="mt-6">
                      {results.itineraries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.itineraries.map(renderItineraryCard)}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No itineraries found</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="user" className="mt-6">
                      {results.users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.users.map(renderUserCard)}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No users found</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No results found</h3>
                    <p className="text-muted-foreground">Try searching with different keywords</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
