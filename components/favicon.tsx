import Head from "next/head"

export function Favicon() {
  return (
    <Head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
    </Head>
  )
}
