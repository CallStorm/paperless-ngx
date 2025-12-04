import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { Results } from 'src/app/data/results'
import { AbstractPaperlessService } from './abstract-paperless-service'

export interface Prompt {
  id?: number
  type: string
  content: string
  created_at?: string
  updated_at?: string
}

@Injectable({
  providedIn: 'root',
})
export class PromptService extends AbstractPaperlessService<Prompt> {
  constructor() {
    super()
    this.resourceName = 'prompts'
  }

  upsertPrompt(type: string, content: string, existing?: Prompt): Observable<Prompt> {
    if (existing && existing.id) {
      return this.update({
        ...existing,
        content,
      })
    }
    return this.create({ type, content } as Prompt)
  }

  listAllPrompts(): Observable<Prompt[]> {
    return this.listAll().pipe(
      // Results<Prompt> -> Prompt[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (source$ => source$.pipe()) as any
    ) as unknown as Observable<Prompt[]>
  }
}


