import Link from "next/link"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppHeader } from "@/components/app-header"

export default function DiscoverPage() {
  const categories = [
    { name: "Outdoor", count: "1.2K", icon: "🏞️" },
    { name: "Food & Drink", count: "987", icon: "🍹" },
    { name: "Music", count: "856", icon: "🎵" },
    { name: "Tech", count: "743", icon: "💻" },
    { name: "Arts & Culture", count: "612", icon: "🎨" },
    { name: "Sports", count: "534", icon: "⚽" },
  ]

  const featuredCalendars = [
    {
      name: "Weekend Adventures",
      description: "Outdoor activities and adventures for weekend warriors",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Tech Meetups",
      description: "Connect with tech enthusiasts and professionals",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Foodie Favorites",
      description: "Culinary experiences and food festivals",
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const cities = [
    { name: "New York", count: "45", icon: "🗽" },
    { name: "Los Angeles", count: "38", icon: "🌴" },
    { name: "Chicago", count: "27", icon: "🏙️" },
    { name: "Miami", count: "23", icon: "🏖️" },
    { name: "Austin", count: "19", icon: "🎸" },
    { name: "San Francisco", count: "31", icon: "🌉" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 pb-12">
        <div className="container px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 mb-4">Discover Events</h1>
          <p className="text-muted-foreground mb-8">
            Explore popular events near you, browse by category, or check out some of the great community calendars.
          </p>

          <div className="space-y-10">
            {/* Categories */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Link
                    href={`/discover/category/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                    key={category.name}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.count} Events</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Featured Calendars */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Featured Calendars</h2>
              <div className="space-y-4">
                {featuredCalendars.map((calendar) => (
                  <Link
                    href={`/discover/calendar/${calendar.name.toLowerCase().replace(/\s+/g, "-")}`}
                    key={calendar.name}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4"
                  >
                    <Image
                      src={calendar.image || "/placeholder.svg"}
                      alt={calendar.name}
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <div>
                      <h3 className="font-medium text-lg">{calendar.name}</h3>
                      <p className="text-sm text-muted-foreground">{calendar.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Explore Local Events */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Explore Local Events</h2>

              <Tabs defaultValue="north-america" className="mb-6">
                <TabsList className="bg-white/70 backdrop-blur-sm">
                  <TabsTrigger value="north-america">North America</TabsTrigger>
                  <TabsTrigger value="europe">Europe</TabsTrigger>
                  <TabsTrigger value="asia">Asia & Pacific</TabsTrigger>
                  <TabsTrigger value="other">Other Regions</TabsTrigger>
                </TabsList>

                <TabsContent value="north-america" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cities.map((city) => (
                      <Link
                        href={`/discover/city/${city.name.toLowerCase().replace(/\s+/g, "-")}`}
                        key={city.name}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center text-2xl">
                          {city.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{city.name}</h3>
                          <p className="text-sm text-muted-foreground">{city.count} Events</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="europe" className="mt-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <p>European events coming soon!</p>
                  </div>
                </TabsContent>

                <TabsContent value="asia" className="mt-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Asia & Pacific events coming soon!</p>
                  </div>
                </TabsContent>

                <TabsContent value="other" className="mt-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <p>More regions coming soon!</p>
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
