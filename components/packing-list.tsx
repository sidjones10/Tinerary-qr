"use client"

import { useState, useTransition, useOptimistic } from "react"
import { Briefcase, Trash2, Plus, LinkIcon, Edit, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { createPackingItem, updatePackingItem, togglePackingItem, deletePackingItem } from "@/app/actions/packing-items"
import { PackingTemplateSelector } from "@/components/packing-template-selector"

interface PackingItem {
  id: string
  name: string
  category?: string
  quantity?: number
  packed: boolean
  url?: string
  tripId: string
}

interface PackingListProps {
  simplified?: boolean
  items: PackingItem[]
  tripId: string
  onItemsChange?: () => void
}

export function PackingList({ simplified = false, items, tripId, onItemsChange }: PackingListProps) {
  // State for form inputs
  const [newItemName, setNewItemName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("clothing")
  const [newItemUrl, setNewItemUrl] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // State for error handling
  const [error, setError] = useState<string | null>(null)

  // Loading states
  const [isPending, startTransition] = useTransition()
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null)

  // Optimistic updates
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state, action: { type: string; item: PackingItem; id?: string }) => {
      switch (action.type) {
        case "toggle":
          return state.map((item) => (item.id === action.item.id ? { ...item, packed: !item.packed } : item))
        case "add":
          return [...state, action.item]
        case "update":
          return state.map((item) => (item.id === action.item.id ? action.item : item))
        case "delete":
          return state.filter((item) => item.id !== action.id)
        default:
          return state
      }
    },
  )

  const categories = [
    { id: "clothing", name: "Clothing", icon: "👕" },
    { id: "toiletries", name: "Toiletries", icon: "🧴" },
    { id: "accessories", name: "Accessories", icon: "👓" },
    { id: "electronics", name: "Electronics", icon: "📱" },
    { id: "food", name: "Food & Drinks", icon: "🍎" },
  ]

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    setIsAddingItem(true)
    setError(null)

    // Create temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`

    // Create optimistic item
    const optimisticItem: PackingItem = {
      id: tempId,
      name: newItemName,
      category: selectedCategory,
      quantity: newItemQuantity,
      packed: false,
      url: newItemUrl.trim() ? newItemUrl : undefined,
      tripId,
    }

    // Save values before reset
    const itemName = newItemName
    const itemQuantity = newItemQuantity

    // Reset form
    setNewItemName("")
    setNewItemUrl("")
    setNewItemQuantity(1)

    // Create form data
    const formData = new FormData()
    formData.append("name", itemName)
    formData.append("quantity", itemQuantity.toString())
    formData.append("packed", "off")

    try {
      startTransition(async () => {
        // Add optimistic item inside transition
        addOptimisticItem({ type: "add", item: optimisticItem })

        const result = await createPackingItem(tripId, formData)

        if (!result.success) {
          // Handle validation errors
          if (result.errors) {
            const errorMessage = Object.values(result.errors).flat().join(", ")
            setError(errorMessage)
            // Remove optimistic item on error
            addOptimisticItem({
              type: "delete",
              item: optimisticItem,
              id: tempId,
            })
          }
        } else {
          toast({
            title: "Item added",
            description: `${itemName} has been added to your packing list.`,
          })
          // Close the dialog and notify parent to refresh data
          setShowAddDialog(false)
          onItemsChange?.()
        }

        setIsAddingItem(false)
      })
    } catch (err) {
      setError("Failed to add item. Please try again.")
      // Remove optimistic item on error - also needs to be in transition
      startTransition(() => {
        addOptimisticItem({
          type: "delete",
          item: optimisticItem,
          id: tempId,
        })
      })
      setIsAddingItem(false)
    }
  }

  const handleToggleItem = async (id: string, currentPacked: boolean) => {
    // Find the item
    const item = optimisticItems.find((item) => item.id === id)
    if (!item) return

    // Apply optimistic update
    addOptimisticItem({
      type: "toggle",
      item: { ...item, packed: !currentPacked },
    })

    try {
      startTransition(async () => {
        const result = await togglePackingItem(id, tripId, !currentPacked)

        if (!result.success) {
          // Revert optimistic update on error
          addOptimisticItem({
            type: "toggle",
            item: { ...item, packed: currentPacked },
          })
          setError("Failed to update item status. Please try again.")
        }
      })
    } catch (err) {
      // Revert optimistic update on error
      addOptimisticItem({
        type: "toggle",
        item: { ...item, packed: currentPacked },
      })
      setError("Failed to update item status. Please try again.")
    }
  }

  const handleRemoveItem = async (id: string) => {
    // Find the item
    const item = optimisticItems.find((item) => item.id === id)
    if (!item) return

    setIsDeletingItem(id)

    // Apply optimistic update
    addOptimisticItem({ type: "delete", item, id })

    try {
      startTransition(async () => {
        const result = await deletePackingItem(id, tripId)

        if (!result.success) {
          // Revert optimistic update on error
          addOptimisticItem({ type: "add", item })
          setError("Failed to delete item. Please try again.")
        } else {
          toast({
            title: "Item removed",
            description: `${item.name} has been removed from your packing list.`,
          })
          // Notify parent to refresh data
          onItemsChange?.()
        }

        setIsDeletingItem(null)
      })
    } catch (err) {
      // Revert optimistic update on error
      addOptimisticItem({ type: "add", item })
      setError("Failed to delete item. Please try again.")
      setIsDeletingItem(null)
    }
  }

  const startEditItem = (item: PackingItem) => {
    setEditingItem(item)
  }

  const handleSaveEditItem = async () => {
    if (!editingItem) return

    setError(null)

    // Store original item for potential rollback
    const originalItem = items.find((item) => item.id === editingItem.id)
    if (!originalItem) return

    // Apply optimistic update
    addOptimisticItem({ type: "update", item: editingItem })

    // Create form data
    const formData = new FormData()
    formData.append("name", editingItem.name)
    formData.append("quantity", editingItem.quantity?.toString() || "1")
    formData.append("packed", editingItem.packed ? "on" : "off")

    try {
      startTransition(async () => {
        const result = await updatePackingItem(editingItem.id, tripId, formData)

        if (!result.success) {
          // Handle validation errors
          if (result.errors) {
            const errorMessage = Object.values(result.errors).flat().join(", ")
            setError(errorMessage)
            // Revert optimistic update on error
            addOptimisticItem({ type: "update", item: originalItem })
          }
        } else {
          toast({
            title: "Item updated",
            description: `${editingItem.name} has been updated.`,
          })
          setEditingItem(null)
          // Notify parent to refresh data
          onItemsChange?.()
        }
      })
    } catch (err) {
      setError("Failed to update item. Please try again.")
      // Revert optimistic update on error
      addOptimisticItem({ type: "update", item: originalItem })
    }
  }

  const packedCount = optimisticItems.filter((item) => item.packed).length
  const totalCount = optimisticItems.length
  const progressPercentage = Math.round((packedCount / totalCount) * 100) || 0

  const handleTemplateSelect = async (templateItems: { name: string; category: string; quantity: number }[]) => {
    for (const item of templateItems) {
      const formData = new FormData()
      formData.append("name", item.name)
      formData.append("quantity", item.quantity.toString())
      formData.append("packed", "off")

      try {
        await createPackingItem(tripId, formData)
      } catch (err) {
        console.error("Failed to add template item:", err)
      }
    }

    toast({
      title: "Template added",
      description: `${templateItems.length} items have been added to your packing list.`,
    })
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Briefcase className="mr-2 h-5 w-5 text-orange-500" />
          What's in my bag
        </CardTitle>
        <p className="text-sm text-muted-foreground">Keep track of everything you need to pack for your trip</p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress bar always shown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Packing progress</span>
            <span className="font-medium">
              {packedCount}/{totalCount} items packed
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Only show Add Item button in full mode */}
        {!simplified && (
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-pink-500 hover:bg-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Item to Packing List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., Toothbrush, Charger, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-category">Category</Label>
                  <select
                    id="item-category"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-url">Product Link (optional)</Label>
                  <div className="flex items-center border rounded-md">
                    <LinkIcon className="ml-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="item-url"
                      value={newItemUrl}
                      onChange={(e) => setNewItemUrl(e.target.value)}
                      placeholder="https://example.com/product"
                      className="border-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Add a link to where this item can be purchased</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleAddItem}
                  disabled={!newItemName.trim() || isAddingItem}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  {isAddingItem ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add to List"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PackingTemplateSelector
            onSelectTemplate={handleTemplateSelect}
          />
          </div>
        )}

        {/* Edit dialog only in full mode */}
        {!simplified && (
          <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Item</DialogTitle>
              </DialogHeader>
              {editingItem && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-item-name">Item Name</Label>
                    <Input
                      id="edit-item-name"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-item-category">Category</Label>
                    <select
                      id="edit-item-category"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingItem.category || "clothing"}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-item-quantity">Quantity</Label>
                    <Input
                      id="edit-item-quantity"
                      type="number"
                      min="1"
                      value={editingItem.quantity || 1}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          quantity: Number.parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-item-url">Product Link (optional)</Label>
                    <div className="flex items-center border rounded-md">
                      <LinkIcon className="ml-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-item-url"
                        value={editingItem.url || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            url: e.target.value || undefined,
                          })
                        }
                        placeholder="https://example.com/product"
                        className="border-0"
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditItem} disabled={isPending} className="bg-pink-500 hover:bg-pink-600">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Tabs always shown */}
        <Tabs defaultValue="all-items" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-items">All Items</TabsTrigger>
            <TabsTrigger value="packed">Packed</TabsTrigger>
            <TabsTrigger value="still-needed">Still Needed</TabsTrigger>
          </TabsList>

          <TabsContent value="all-items" className="mt-4">
            {categories.map((category) => {
              const categoryItems = optimisticItems.filter((item) => (item.category || "clothing") === category.id)
              if (categoryItems.length === 0) return null

              return (
                <div key={category.id} className="mb-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {category.icon} {category.name}
                  </Badge>

                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center flex-1">
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={item.packed}
                              onChange={() => handleToggleItem(item.id, item.packed)}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              disabled={isPending}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className={item.packed ? "line-through text-gray-400" : ""}>
                              {item.name} {item.quantity && item.quantity > 1 ? `(${item.quantity})` : ""}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View product
                              </a>
                            )}
                          </div>
                        </div>
                        {!simplified && (
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditItem(item)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-1"
                              disabled={isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                              disabled={isPending || isDeletingItem === item.id}
                            >
                              {isDeletingItem === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {optimisticItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in your packing list yet.</p>
                {!simplified && <p className="text-sm mt-2">Click "Add Item" to start building your list.</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="packed" className="mt-4">
            {categories.map((category) => {
              const categoryItems = optimisticItems.filter(
                (item) => (item.category || "clothing") === category.id && item.packed,
              )
              if (categoryItems.length === 0) return null

              return (
                <div key={category.id} className="mb-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {category.icon} {category.name}
                  </Badge>

                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center flex-1">
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={item.packed}
                              onChange={() => handleToggleItem(item.id, item.packed)}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              disabled={isPending}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="line-through text-gray-400">
                              {item.name} {item.quantity && item.quantity > 1 ? `(${item.quantity})` : ""}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View product
                              </a>
                            )}
                          </div>
                        </div>
                        {!simplified && (
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditItem(item)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-1"
                              disabled={isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                              disabled={isPending || isDeletingItem === item.id}
                            >
                              {isDeletingItem === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {optimisticItems.filter((item) => item.packed).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No packed items yet.</p>
                <p className="text-sm mt-2">Check off items as you pack them.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="still-needed" className="mt-4">
            {categories.map((category) => {
              const categoryItems = optimisticItems.filter(
                (item) => (item.category || "clothing") === category.id && !item.packed,
              )
              if (categoryItems.length === 0) return null

              return (
                <div key={category.id} className="mb-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {category.icon} {category.name}
                  </Badge>

                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center flex-1">
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={item.packed}
                              onChange={() => handleToggleItem(item.id, item.packed)}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              disabled={isPending}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span>
                              {item.name} {item.quantity && item.quantity > 1 ? `(${item.quantity})` : ""}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View product
                              </a>
                            )}
                          </div>
                        </div>
                        {!simplified && (
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditItem(item)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-1"
                              disabled={isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                              disabled={isPending || isDeletingItem === item.id}
                            >
                              {isDeletingItem === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {optimisticItems.filter((item) => !item.packed).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>All items are packed! 🎉</p>
                <p className="text-sm mt-2">You're ready for your trip.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
