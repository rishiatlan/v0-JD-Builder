import { EnvironmentVariablesCheck } from "@/components/env-check"

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Environment Variables Check</h2>
        <EnvironmentVariablesCheck />
      </div>
    </div>
  )
}
