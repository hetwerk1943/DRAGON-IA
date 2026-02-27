'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  isActive: boolean;
}

const defaultAgents: Agent[] = [
  {
    id: '1',
    name: 'General Assistant',
    description: 'A versatile AI assistant for general tasks',
    model: 'gpt-4',
    isActive: true,
  },
  {
    id: '2',
    name: 'Code Expert',
    description: 'Specialized in code generation and debugging',
    model: 'gpt-4-turbo',
    isActive: true,
  },
  {
    id: '3',
    name: 'Research Analyst',
    description: 'Deep research and analysis capabilities',
    model: 'gpt-4',
    isActive: false,
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dragon-heading">Agents</h1>
        <button className="bg-dragon-accent hover:bg-dragon-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Create Agent
        </button>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-dragon-card border border-dragon-border rounded-lg p-6 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-gray-200">{agent.name}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    agent.isActive
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}
                >
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{agent.description}</p>
              <span className="text-xs text-gray-500">Model: {agent.model}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAgent(agent.id)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  agent.isActive
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                    : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                }`}
              >
                {agent.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
