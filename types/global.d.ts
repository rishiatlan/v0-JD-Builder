interface Window {
  mammoth?: {
    extractRawText: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: any[] }>
  }
}
