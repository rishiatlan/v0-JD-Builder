"use client"

import { useState, useEffect } from "react"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { JDService } from "@/lib/jd-service"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Edit, ArrowLeft, Download, Share2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"

export default function ViewJobDescriptionPage({ params }: { params: { id: string } }) {
  const [jdData, setJdData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { authState } = useAuth()

  useEffect(() => {
    const loadJD = async () => {
      try {
        const { success, data, error } = await JDService.getJD(params.id)
        if (success && data) {
          setJdData(data)
        } else {
          toast({
            title: "Error",
            description: error || "Failed to load job description",
            variant: "destructive",
          })
          router.push("/history")
        }
      } catch (error) {
        console.error("Error loading JD:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        router.push("/history")
      } finally {
        setLoading(false)
      }
    }

    loadJD()
  }, [params.id, router, toast])

  const handleEdit = () => {
    router.push(`/jd/${params.id}/edit`)
  }

  const handleBack = () => {
    router.push("/history")
  }

  const handleDownload = () => {
    if (!jdData) return

    // Create a blob with the JD content
    const content = typeof jdData.content === "string" ? jdData.content : JSON.stringify(jdData.content, null, 2)

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${jdData.title.replace(/\s+/g, "-").toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (!jdData) return

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: jdData.title,
          text: `Check out this job description for ${jdData.title}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Job description link copied to clipboard",
      })
    }
  }

  // With stub auth, we'll consider the user as the owner of all JDs
  const isOwner = true

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <AtlanHeader />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
        </main>
        <AtlanFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-6 text-atlan-primary hover:text-atlan-primary-dark">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>

        {jdData && (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-atlan-primary">{jdData.title}</CardTitle>
                  <p className="text-slate-600 mt-1">{jdData.department}</p>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="text-atlan-primary border-atlan-primary hover:bg-atlan-primary/10"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                <span>Created: {formatDistanceToNow(new Date(jdData.created_at), { addSuffix: true })}</span>
                <span className="mx-2">•</span>
                <span>Updated: {formatDistanceToNow(new Date(jdData.updated_at), { addSuffix: true })}</span>
                {jdData.user_email && (
                  <>
                    <span className="mx-2">•</span>
                    <span>By: {jdData.user_email}</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-slate max-w-none">
                {typeof jdData.content === "string" ? (
                  <pre className="whitespace-pre-wrap">{jdData.content}</pre>
                ) : (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(jdData.content, null, 2)}</pre>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
      <AtlanFooter />
    </div>
  )
}
