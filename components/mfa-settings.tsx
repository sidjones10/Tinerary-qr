"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"

interface MfaFactor {
  id: string
  friendly_name: string | null
  factor_type: string
  status: string
}

export function MfaSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Enrollment state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollData, setEnrollData] = useState<{
    factorId: string
    qrCode: string
    secret: string
  } | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Disable state
  const [isDisabling, setIsDisabling] = useState(false)

  const hasActiveFactor = factors.some((f) => f.status === "verified")

  // Load existing MFA factors
  useEffect(() => {
    const loadFactors = async () => {
      if (!user) return
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) {
          console.error("Error loading MFA factors:", error)
          return
        }
        setFactors(data.totp || [])
      } catch (err) {
        console.error("Error loading MFA factors:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadFactors()
  }, [user])

  // Start enrollment
  const handleEnroll = async () => {
    setIsEnrolling(true)
    try {
      const res = await fetch("/api/auth/mfa/enroll", { method: "POST" })
      const result = await res.json()
      if (!result.success) {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        return
      }
      setEnrollData({
        factorId: result.factorId,
        qrCode: result.qrCode,
        secret: result.secret,
      })
      setVerifyCode("")
      setEnrollOpen(true)
    } catch {
      toast({ title: "Error", description: "Failed to start enrollment", variant: "destructive" })
    } finally {
      setIsEnrolling(false)
    }
  }

  // Verify TOTP code to activate enrollment
  const handleVerify = async () => {
    if (!enrollData || verifyCode.length !== 6) return
    setIsVerifying(true)
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: enrollData.factorId, code: verifyCode }),
      })
      const result = await res.json()
      if (!result.success) {
        toast({ title: "Invalid code", description: result.message, variant: "destructive" })
        return
      }
      toast({ title: "2FA enabled", description: "Two-factor authentication is now active on your account." })
      setEnrollOpen(false)
      setEnrollData(null)
      // Refresh factors list
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()
      setFactors(data?.totp || [])
    } catch {
      toast({ title: "Error", description: "Failed to verify code", variant: "destructive" })
    } finally {
      setIsVerifying(false)
    }
  }

  // Disable 2FA
  const handleDisable = async (factorId: string) => {
    setIsDisabling(true)
    try {
      const res = await fetch("/api/auth/mfa/unenroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId }),
      })
      const result = await res.json()
      if (!result.success) {
        toast({ title: "Error", description: result.message, variant: "destructive" })
        return
      }
      toast({ title: "2FA disabled", description: "Two-factor authentication has been removed." })
      setFactors((prev) => prev.filter((f) => f.id !== factorId))
    } catch {
      toast({ title: "Error", description: "Failed to disable 2FA", variant: "destructive" })
    } finally {
      setIsDisabling(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Two-Factor Authentication
                {hasActiveFactor ? (
                  <Badge variant="default" className="bg-green-600">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account with an authenticator app
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasActiveFactor ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md border border-green-200">
                <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Your account is protected with 2FA</p>
                  <p className="text-xs text-green-600">You&apos;ll be asked for a verification code each time you sign in.</p>
                </div>
              </div>
              {factors.filter((f) => f.status === "verified").map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="text-sm font-medium">{factor.friendly_name || "Authenticator app"}</p>
                    <p className="text-xs text-muted-foreground">TOTP</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisable(factor.id)}
                    disabled={isDisabling}
                  >
                    {isDisabling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                <ShieldOff className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">2FA is not enabled</p>
                  <p className="text-xs text-amber-600">We strongly recommend enabling two-factor authentication.</p>
                </div>
              </div>
              <Button onClick={handleEnroll} disabled={isEnrolling}>
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Enable Two-Factor Authentication"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to activate.
            </DialogDescription>
          </DialogHeader>
          {enrollData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enrollData.qrCode} alt="QR code for authenticator app" className="w-48 h-48" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Or enter this key manually:</Label>
                <code className="block bg-muted p-2 rounded text-xs text-center font-mono break-all select-all">
                  {enrollData.secret}
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totp-code">Verification code</Label>
                <Input
                  id="totp-code"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest font-mono"
                  autoComplete="one-time-code"
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Activate 2FA"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
