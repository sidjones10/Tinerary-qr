"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Plus, Trash2, Shield } from "lucide-react"
import { useConsent } from "@/providers/consent-provider"

export function PaymentSettings() {
  const { toast } = useToast()
  const { accountType, canUsePayments } = useConsent()
  const isMinor = accountType === "minor"

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: "visa",
      last4: "4242",
      expiry: "04/2025",
    },
    {
      id: 2,
      type: "mastercard",
      last4: "8888",
      expiry: "12/2026",
    },
  ])

  const [billingHistory, setBillingHistory] = useState([
    {
      id: 1,
      date: "Mar 15, 2025",
      description: "Premium Subscription",
      amount: "$9.99",
      status: "Paid",
    },
    {
      id: 2,
      date: "Feb 15, 2025",
      description: "Premium Subscription",
      amount: "$9.99",
      status: "Paid",
    },
  ])

  const handleAddPaymentMethod = () => {
    toast({
      title: "Add payment method",
      description: "This feature is coming soon.",
    })
  }

  const handleEditPaymentMethod = (id: number) => {
    toast({
      title: "Edit payment method",
      description: `Editing payment method ${id}.`,
    })
  }

  const handleRemovePaymentMethod = (id: number) => {
    toast({
      title: "Remove payment method",
      description: `Removing payment method ${id}.`,
    })
  }

  const handleEditAddress = () => {
    toast({
      title: "Edit address",
      description: "This feature is coming soon.",
    })
  }

  // If user is a minor without parental consent, show restricted view
  if (isMinor && !canUsePayments) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 border-amber-200">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Minor Account Restriction:</strong> As a user under 18, you need parental consent to access payment features.
                Please ask your parent or guardian to update your consent settings in your profile.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Saved Payment Methods</h3>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
                      {method.type === "visa" ? (
                        <span className="font-bold text-blue-600">VISA</span>
                      ) : (
                        <span className="font-bold text-red-600">MC</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.type === "visa" ? "Visa" : "Mastercard"} ending in {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPaymentMethod(method.id)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Billing Address</h3>

            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <p>Jessica Chen</p>
                  <p>123 Main Street</p>
                  <p>Apt 4B</p>
                  <p>Los Angeles, CA 90001</p>
                  <p>United States</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleEditAddress}>
                  Edit Address
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Billing History</h3>

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border">
                  {billingHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{item.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{item.description}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{item.amount}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
