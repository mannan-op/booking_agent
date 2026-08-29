import { useCallback, useEffect, useState } from "react"

export function useLiveData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) {
        setIsLoading(true)
      }
      try {
        const response = await fetch(url, { cache: "no-store" })
        const body = (await response.json()) as T & { error?: string }
        if (!response.ok) {
          throw new Error(body.error || "Request failed")
        }
        setError("")
        setData(body)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Request failed")
        setData(null)
      } finally {
        setIsLoading(false)
      }
    },
    [url],
  )

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) {
        void load(false)
      }
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [load])

  return { data, isLoading, error, reload: () => load(true) }
}
