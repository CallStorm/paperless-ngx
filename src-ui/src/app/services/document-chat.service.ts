import { Injectable, inject } from '@angular/core'
import { Meta } from '@angular/platform-browser'
import { CookieService } from 'ngx-cookie-service'
import { environment } from 'src/environments/environment'

export type DocumentChatRole = 'system' | 'user' | 'assistant'

export interface DocumentChatMessagePayload {
  role: DocumentChatRole
  content: string
}

export interface DocumentChatRequest {
  messages: DocumentChatMessagePayload[]
}

export interface DocumentChatStreamCallbacks {
  onChunk?: (chunk: string) => void
  onComplete?: () => void
  onError?: (error: Error) => void
  onAbort?: () => void
  onFinally?: () => void
}

@Injectable({
  providedIn: 'root',
})
export class DocumentChatService {
  private meta = inject(Meta)
  private cookieService = inject(CookieService)
  private readonly baseUrl = environment.apiBaseUrl

  streamDocRead(
    documentId: number,
    payload: DocumentChatRequest,
    callbacks: DocumentChatStreamCallbacks = {}
  ): AbortController {
    const controller = new AbortController()
    // Fire and forget; rejections are handled inside executeStream
    void this.executeStream(documentId, payload, callbacks, controller)
    return controller
  }

  private async executeStream(
    documentId: number,
    payload: DocumentChatRequest,
    callbacks: DocumentChatStreamCallbacks,
    controller: AbortController
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}documents/${documentId}/doc_read/`,
        {
          method: 'POST',
          headers: this.buildHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          errorText || $localize`DocRead service returned an error response.`
        )
      }

      if (!response.body) {
        throw new Error(
          $localize`Streaming is not supported in this browser environment.`
        )
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }
          const chunk = decoder.decode(value, { stream: true })
          if (chunk) {
            callbacks.onChunk?.(chunk)
          }
        }
        const remainder = decoder.decode()
        if (remainder) {
          callbacks.onChunk?.(remainder)
        }
        callbacks.onComplete?.()
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        callbacks.onAbort?.()
      } else if (
        (error as { name?: string }).name === 'AbortError' &&
        !(error instanceof DOMException)
      ) {
        callbacks.onAbort?.()
      } else {
        const wrappedError =
          error instanceof Error
            ? error
            : new Error($localize`Unexpected error while streaming.`)
        callbacks.onError?.(wrappedError)
      }
    } finally {
      callbacks.onFinally?.()
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/plain, application/json',
    }
    const prefix = this.meta.getTag('name=cookie_prefix')?.content ?? ''
    const csrfToken = this.cookieService.get(`${prefix}csrftoken`)
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken
    }
    return headers
  }
}


