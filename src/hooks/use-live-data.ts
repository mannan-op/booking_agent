import { useCallback, useEffect, useState } from "react"

export function useLiveData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(url, { cache: "no-store" })
      const body = (await response.json()) as T & { error?: string }
      if (!response.ok) {
        throw new Error(body.error || "Request failed")
      }
      setData(body)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [url])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, isLoading, error, reload }
}
