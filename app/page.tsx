export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to{" "}
          <a className="text-blue-600" href="https://atlan.com">
            Atlan
          </a>
        </h1>

        <p className="mt-3 text-2xl">JD Builder Test Deployment</p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <p className="p-6 mt-6 text-left border w-96 rounded-xl">
            This is a test deployment to fix the build issues.
          </p>
        </div>
      </main>
    </div>
  )
}
