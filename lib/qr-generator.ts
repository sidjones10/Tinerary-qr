import QRCode from "qrcode"

export async function generateQRCode(data: string, options: QRCode.QRCodeToDataURLOptions = {}): Promise<string> {
  try {
    // Default options
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }

    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options }

    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(data, mergedOptions)
    return dataUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

export async function generateTicketQRCode(ticketId: string): Promise<string> {
  // Create a verification URL or deep link that can be used to verify the ticket
  const verificationData = `${process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"}/tickets/verify/${ticketId}`

  // Generate QR code with custom options
  return generateQRCode(verificationData, {
    width: 300,
    margin: 2,
    color: {
      dark: "#4f46e5", // Indigo color for the QR code
      light: "#ffffff",
    },
    errorCorrectionLevel: "H", // High error correction level
  })
}
