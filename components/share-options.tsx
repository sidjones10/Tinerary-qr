"use client"

import type React from "react"
import { useState } from "react"

interface ShareOption {
  id: string
  name: string
  selected: boolean
}

interface ShareOptionsProps {
  initialOptions: ShareOption[]
}

const ShareOptions: React.FC<ShareOptionsProps> = ({ initialOptions }) => {
  const [shareOptions, setShareOptions] = useState(initialOptions)

  return (
    <div>
      {shareOptions.map((option) => (
        <div key={option.id}>
          <label>
            {option.name}
            <input
              type="checkbox"
              checked={option.selected}
              onChange={(e) => {
                const updatedOptions = shareOptions.map((opt) =>
                  opt.id === option.id ? { ...opt, selected: e.target.checked } : opt,
                )
                setShareOptions(updatedOptions)
              }}
            />
          </label>
        </div>
      ))}
    </div>
  )
}

export default ShareOptions
