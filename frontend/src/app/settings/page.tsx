'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);

  const models = [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ];

  return (
    <div className="flex-1 p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-dragon-heading mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Model Selection */}
        <div className="bg-dragon-card border border-dragon-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Model Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Default Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-dragon-bg border border-dragon-border rounded px-3 py-2 text-gray-200"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Memory Settings */}
        <div className="bg-dragon-card border border-dragon-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Memory</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-gray-300">Enable conversation memory</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-gray-300">Enable long-term memory</span>
            </label>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-dragon-card border border-dragon-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">API Base URL</label>
              <input
                type="text"
                defaultValue="http://localhost:4000/api"
                className="w-full bg-dragon-bg border border-dragon-border rounded px-3 py-2 text-gray-200"
              />
            </div>
          </div>
        </div>

        <button className="bg-dragon-accent hover:bg-dragon-accent/80 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
