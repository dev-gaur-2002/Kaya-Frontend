export type Question = {
  id: string
  type: 'single' | 'multi' | 'number' | 'text' | 'date' | 'boolean'
  prompt: string
  help_text?: string
  options?: { value: string; label: string }[]
  validation?: { min?: number; max?: number; required?: boolean }
  show_if?: { question: string; in: string[] }
  writes_to: string
}

export type Profile = {
  id: string
  dob: string | null
  sex: string | null
  conditions: string[]
  medications: { name: string; purpose?: string; timing?: string }[]
  constraints: Record<string, boolean>
  goals: string[]
  derived: { summary?: string } | null
  onboarded_at: string | null
}

export type Vital = {
  id: string
  kind: string
  value: number
  unit: string
  measured_at: string
  source: string
  confirmed: boolean
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  safety_rule_key: string | null
  created_at: string
}

export type GoalTemplate = {
  code: string
  title: string
  unit: string
  default_target: number
  cadence: 'daily' | 'weekly'
}
