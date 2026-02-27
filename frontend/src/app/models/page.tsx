'use client'

import { useState, useEffect } from 'react'

interface Model {
  id: string
  context_window: number
  input_price_per_1k: number
  output_price_per_1k: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/v1/ai/models`)
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(() => setModels([]))
  }, [])

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-dragon-orange">Available Models</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <div key={model.id} className="rounded-lg border border-dragon-border bg-dragon-card p-6">
            <h3 className="text-lg font-semibold text-white">{model.id}</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-400">
              <p>Context Window: <span className="text-white">{model.context_window.toLocaleString()} tokens</span></p>
              <p>Input: <span className="text-dragon-green">${model.input_price_per_1k}/1K tokens</span></p>
              <p>Output: <span className="text-dragon-green">${model.output_price_per_1k}/1K tokens</span></p>
            </div>
          </div>
        ))}
        {models.length === 0 && (
          <p className="text-gray-500">Loading models or unable to connect to API...</p>
        )}
      </div>
    </div>
  )
}
