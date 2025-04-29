import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HistoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">JD History</h1>
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
          View and manage your previously created job descriptions.
        </p>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Recent Job Descriptions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-center py-8 text-slate-500">
                  You haven't created any job descriptions yet.
                  <Link href="/" className="text-atlan-primary ml-2 hover:underline">
                    Create your first JD
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AtlanFooter />
    </div>
  )
}
