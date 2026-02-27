'use client'

import { useState, useEffect } from 'react'

interface Tool {
  name: string
  description: string
  type: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/v1/tools/`)
      .then(res => res.json())
      .then(data => setTools(data.tools || []))
      .catch(() => setTools([]))
  }, [])

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-dragon-orange">Available Tools</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <div key={tool.name} className="rounded-lg border border-dragon-border bg-dragon-card p-6">
            <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
            <p className="mt-2 text-sm text-gray-400">{tool.description}</p>
            <span className="mt-3 inline-block rounded bg-dragon-dark px-2 py-1 text-xs text-dragon-green">
              {tool.type}
            </span>
          </div>
        ))}
        {tools.length === 0 && (
          <p className="text-gray-500">Loading tools or unable to connect to API...</p>
        )}
      </div>
    </div>
  )
}
