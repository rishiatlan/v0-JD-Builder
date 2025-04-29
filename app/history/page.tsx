"use client"

import { useState, useEffect } from "react"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JDService } from "@/lib/jd-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, FileText, Trash2, ExternalLink, Clock, User } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<string>("my-jds")
  const [myJDs, setMyJDs] = useState<any[]>([])
  const [allJDs, setAllJDs] = useState<any[]>([])
  const [myHistory, setMyHistory] = useState<any[]>([])
  const [allHistory, setAllHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { authState } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load data based on active tab
        if (activeTab === "my-jds") {
          const { success, data, error } = await JDService.getUserJDs()
          if (success && data) {
            setMyJDs(data)
          } else if (error) {
            toast({
              title: "Error",
              description: error,
              variant: "destructive",
            })
          }
        } else if (activeTab === "all-jds") {
          const { success, data, error } = await JDService.getAllJDs()
          if (success && data) {
            setAllJDs(data)
          } else if (error) {
            toast({
              title: "Error",
              description: error,
              variant: "destructive",
            })
          }
        } else if (activeTab === "my-history") {
          const { success, data, error } = await JDService.getUserHistory()
          if (success && data) {
            setMyHistory(data)
          } else if (error) {
            toast({
              title: "Error",
              description: error,
              variant: "destructive",
            })
          }
        } else if (activeTab === "all-history") {
          const { success, data, error } = await JDService.getAllHistory()
          if (success && data) {
            setAllHistory(data)
          } else if (error) {
            toast({
              title: "Error",
              description: error,
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error loading history data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [activeTab, toast])

  const handleDeleteJD = async (id: string) => {
    try {
      const { success, error } = await JDService.deleteJD(id)
      if (success) {
        // Remove from state
        setMyJDs((prev) => prev.filter((jd) => jd.id !== id))
        toast({
          title: "Success",
          description: "Job description deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: error || "Failed to delete job description",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting JD:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const formatActionText = (action: string, resourceType: string, metadata: any) => {
    switch (action) {
      case "create":
        return `Created a new ${resourceType.replace("_", " ")}: ${metadata?.title || ""}`
      case "update":
        return `Updated ${resourceType.replace("_", " ")}: ${metadata?.title || ""}`
      case "delete":
        return `Deleted ${resourceType.replace("_", " ")}: ${metadata?.title || ""}`
      case "view":
        return `Viewed ${resourceType.replace("_", " ")}: ${metadata?.title || ""}`
      default:
        return `${action} ${resourceType.replace("_", " ")}`
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">JD History</h1>
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
          View and manage your previously created job descriptions and activity history.
        </p>

        <Tabs defaultValue="my-jds" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="my-jds" className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white">
              My JDs
            </TabsTrigger>
            <TabsTrigger
              value="all-jds"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              All Public JDs
            </TabsTrigger>
            <TabsTrigger
              value="my-history"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              My Activity
            </TabsTrigger>
            <TabsTrigger
              value="all-history"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              All Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-jds">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>My Job Descriptions</span>
                  <Button
                    className="bg-atlan-primary hover:bg-atlan-primary-dark"
                    onClick={() => (window.location.href = "/")}
                  >
                    Create New JD
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                  </div>
                ) : myJDs.length > 0 ? (
                  <div className="space-y-4">
                    {myJDs.map((jd) => (
                      <div key={jd.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-atlan-primary mr-2" />
                            <div>
                              <h3 className="font-medium">{jd.title}</h3>
                              <p className="text-sm text-slate-500">{jd.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (window.location.href = `/jd/${jd.id}`)}
                              className="text-atlan-primary border-atlan-primary hover:bg-atlan-primary/10"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteJD(jd.id)}
                              className="text-red-500 border-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          <span>Created: {formatDistanceToNow(new Date(jd.created_at), { addSuffix: true })}</span>
                          <span className="mx-2">•</span>
                          <span>Updated: {formatDistanceToNow(new Date(jd.updated_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>
                      You haven't created any job descriptions yet.
                      <Link href="/" className="text-atlan-primary ml-2 hover:underline">
                        Create your first JD
                      </Link>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-jds">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">All Public Job Descriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                  </div>
                ) : allJDs.length > 0 ? (
                  <div className="space-y-4">
                    {allJDs.map((jd) => (
                      <div key={jd.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-atlan-primary mr-2" />
                            <div>
                              <h3 className="font-medium">{jd.title}</h3>
                              <p className="text-sm text-slate-500">{jd.department}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = `/jd/${jd.id}`)}
                            className="text-atlan-primary border-atlan-primary hover:bg-atlan-primary/10"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          <span>Created: {formatDistanceToNow(new Date(jd.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No public job descriptions available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-history">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">My Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                  </div>
                ) : myHistory.length > 0 ? (
                  <div className="space-y-4">
                    {myHistory.map((item) => (
                      <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-atlan-primary mr-2" />
                          <div>
                            <p>{formatActionText(item.action, item.resource_type, item.metadata)}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No activity history available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-history">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">All Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                  </div>
                ) : allHistory.length > 0 ? (
                  <div className="space-y-4">
                    {allHistory.map((item) => (
                      <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-atlan-primary mr-2" />
                          <div>
                            <p>
                              <span className="font-medium">{item.user_profiles?.full_name || "Anonymous User"}</span>{" "}
                              {formatActionText(item.action, item.resource_type, item.metadata)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No activity history available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <AtlanFooter />
    </div>
  )
}
