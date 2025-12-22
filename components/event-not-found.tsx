export function EventNotFound() {
  return (
    <div className="container px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <a href="/app" className="text-primary hover:underline">
          Return to Home
        </a>
      </div>
    </div>
  )
}
