"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { JDService, type JobDescription } from "@/lib/jd-service"
import { formatDistanceToNow } from "date-fns"
import { Loader2, FileText, Trash2, Edit, Eye } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HistoryPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { authState } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function loadJobDescriptions() {
      setIsLoading(true)
      setError(null)

      try {
        // Since we're always authenticated, we can always get JDs
        const jds = await JDService.getJDsByEmail(authState.user?.email || "user@atlan.com")
        setJobDescriptions(jds)
      } catch (err) {
        console.error("Error loading job descriptions:", err)
        setError("Failed to load job descriptions. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadJobDescriptions()
  }, [authState.user?.email])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const success = await JDService.deleteJD(id)
      if (success) {
        setJobDescriptions((prev) => prev.filter((jd) => jd.id !== id))
        toast({
          title: "Job description deleted",
          description: "The job description has been successfully deleted.",
        })

        // Track user activity
        await JDService.trackUserActivity(
          authState.user?.email || "user@atlan.com",
          "delete_jd",
          `Deleted job description with ID: ${id}`,
        )
      } else {
        toast({
          title: "Error",
          description: "Failed to delete job description. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error deleting job description:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow bg-slate-50 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Job Description History</h1>
              <p className="text-slate-600 mt-1">View and manage your previously created job descriptions</p>
            </div>
            <Button onClick={() => router.push("/jd/new")} className="bg-primary hover:bg-primary/90 text-white">
              Create New JD
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Job Descriptions</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : jobDescriptions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
              <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Job Descriptions Found</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                You haven't created any job descriptions yet. Create your first job description to get started.
              </p>
              <Button onClick={() => router.push("/jd/new")} className="bg-primary hover:bg-primary/90 text-white">
                Create Your First JD
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobDescriptions.map((jd) => (
                <Card key={jd.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold truncate">{jd.title || "Untitled JD"}</CardTitle>
                    <CardDescription className="flex items-center text-xs">
                      <span className="truncate">
                        {jd.company || "No company"} • {jd.department || "No department"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-sm text-slate-600 line-clamp-3">
                      {jd.description || "No description provided"}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch pt-0">
                    <div className="text-xs text-slate-500 mb-3">
                      Created {formatDistanceToNow(new Date(jd.created_at), { addSuffix: true })}
                    </div>
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/jd/${jd.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/jd/${jd.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the job description.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(jd.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              {deletingId === jd.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <EnhancedFooter />
    </div>
  )
}
