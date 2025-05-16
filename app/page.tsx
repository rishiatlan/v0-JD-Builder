import { JDBuilderForm } from "@/components/jd-builder-form"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-atlan-primary mb-2">Atlan JD Builder</h1>
        <p className="text-slate-600">
          Create world-class job descriptions that follow Atlan&apos;s standards of excellence.
        </p>
      </div>

      <JDBuilderForm />
    </div>
  )
}
