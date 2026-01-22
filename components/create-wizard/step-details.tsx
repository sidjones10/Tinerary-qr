"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface StepDetailsProps {
  formData: {
    description: string
    coverImage: string
  }
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function StepDetails({ formData, onChange, errors }: StepDetailsProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(formData.coverImage || null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        onChange("coverImage", result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    onChange("coverImage", "")
  }

  const characterCount = formData.description.length
  const maxChars = 500

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="text-base font-semibold">
            Tell us about it
          </Label>
          <span className={`text-sm ${characterCount > maxChars ? "text-red-500" : "text-gray-500"}`}>
            {characterCount}/{maxChars}
          </span>
        </div>
        <Textarea
          id="description"
          placeholder="Describe what makes this special... What should people know? What will you be doing?"
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="min-h-[150px] text-base resize-none"
          maxLength={maxChars}
        />
        {errors?.description && <p className="text-sm text-red-500">{errors.description}</p>}
        <p className="text-sm text-gray-500">Make it exciting! This is what people will see first.</p>
      </div>

      {/* Cover Image */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Cover Photo (Optional)</Label>

        {!imagePreview ? (
          <label
            htmlFor="coverImage"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="p-4 bg-white rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mb-2 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
            <input id="coverImage" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
          </label>
        ) : (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Cover preview"
              className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 rounded-full shadow-lg"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
              <ImageIcon className="inline h-4 w-4 mr-1" />
              Cover Photo
            </div>
          </div>
        )}
      </div>

      {/* Suggested Images */}
      {!imagePreview && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-600">Or choose a suggested image:</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400",
              "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400",
              "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400",
            ].map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setImagePreview(url)
                  onChange("coverImage", url)
                }}
                className="relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-400 transition-all group"
              >
                <img src={url} alt={`Suggested ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>Tip:</strong> A great photo and description can increase engagement by up to 3x! Make it count.
        </p>
      </div>
    </div>
  )
}
