"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface ScriptureCardProps {
  reference: string
  translation: string
  text?: string
  isLoading?: boolean
  error?: string
  copyright?: string
  onRetry?: () => void
}

export function ScriptureCard({
  reference,
  translation,
  text,
  isLoading = false,
  error,
  copyright,
  onRetry,
}: ScriptureCardProps) {
  return (
    <Card className="w-full bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{reference}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{translation}</span>
          {onRetry && error && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="ml-2 p-1 h-auto" title="Retry loading verse">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-[90%] mb-2" />
            <Skeleton className="h-4 w-[80%]" />
          </>
        ) : error ? (
          <div className="text-amber-600 dark:text-amber-400">
            <p>{error}</p>
            {text && <p className="mt-2">{text}</p>}
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
        )}
      </CardContent>
      {copyright && !isLoading && !error && (
        <CardFooter className="pt-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{copyright}</p>
        </CardFooter>
      )}
    </Card>
  )
}
