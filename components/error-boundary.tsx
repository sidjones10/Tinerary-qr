"use client"

import React, { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches React errors and displays a friendly fallback UI with retry option
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-orange-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We encountered an unexpected error. Don't worry, your data is safe. You can try refreshing the page or
                going back home.
              </p>

              {/* Show error details in development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="bg-gray-100 p-3 rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="space-y-2 text-xs font-mono text-gray-600">
                    <div>
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 overflow-auto">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardFooter>

            <div className="px-6 pb-4">
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Async Error Boundary for handling async errors
 * Use this for components that fetch data or have async operations
 */
export function AsyncErrorBoundary({
  children,
  fallback,
  onRetry,
}: {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onRetry?: () => void
}) {
  const [error, setError] = React.useState<Error | null>(null)

  const handleRetry = () => {
    setError(null)
    if (onRetry) {
      onRetry()
    }
  }

  if (error) {
    if (fallback) {
      return <>{fallback(error, handleRetry)}</>
    }

    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Failed to load</h3>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={handleRetry} className="bg-gradient-to-r from-orange-500 to-pink-500">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return <>{children}</>
}

/**
 * Error Fallback Component
 * Reusable error UI for specific scenarios
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  description,
}: {
  error: Error
  resetErrorBoundary: () => void
  title?: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-gray-600">{description || "We encountered an unexpected error. Please try again."}</p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-600">{error.message}</div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={resetErrorBoundary} className="w-full bg-gradient-to-r from-orange-500 to-pink-500">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Network Error Component
 * Specific error UI for network/fetch failures
 */
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto p-4 bg-amber-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="mt-4">Connection Problem</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-gray-600">
            We couldn't connect to the server. Please check your internet connection and try again.
          </p>
        </CardContent>

        <CardFooter>
          <Button onClick={onRetry} className="w-full bg-gradient-to-r from-orange-500 to-pink-500">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Not Found Error Component
 */
export function NotFoundError({ message = "Page not found", homeLink = "/" }: { message?: string; homeLink?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-b from-orange-50 to-pink-50">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto p-4 bg-orange-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">404</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-gray-600 text-lg">{message}</p>
        </CardContent>

        <CardFooter>
          <Link href={homeLink} className="w-full">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
