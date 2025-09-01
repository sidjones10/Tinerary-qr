// Application configuration
export const config = {
  // Base URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://v0-itinerary-app-safies-projects-9d3baf77.vercel.app",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://v0-itinerary-app-safies-projects-9d3baf77.vercel.app/api",

  // Feature flags
  features: {
    phoneVerification: true,
    socialSharing: true,
    notifications: true,
  },

  // Default settings
  defaults: {
    currency: "USD",
    locale: "en-US",
    timezone: "America/Los_Angeles",
  },
}
