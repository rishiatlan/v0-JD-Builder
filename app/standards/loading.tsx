export default function StandardsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6"></div>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="h-7 w-80 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mb-4"></div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-6 w-56 bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="h-7 w-72 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-md">
                <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="space-y-1">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
