"use client"

/**
 * Last-resort error boundary.
 *
 * Catches errors thrown in the root layout itself, where no provider,
 * stylesheet, or component from the app is guaranteed to have loaded. It
 * replaces the entire document, so it must render its own <html>/<body>
 * and must not import anything that could itself be the thing that broke.
 * Styles are inline for the same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#FDFBF7",
          color: "#1C1917",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto",
              borderRadius: "9999px",
              background: "#FDEAD3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>

          <h1 style={{ marginTop: 24, fontSize: 22, fontWeight: 600 }}>
            Tinerary couldn&rsquo;t load
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#57534E" }}>
            Something failed before the app could start. Reloading usually
            fixes it.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#78716C",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              marginTop: 28,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              color: "#1C1917",
              background: "#E8B43A",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
