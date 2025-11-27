import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { AiModel } from 'src/app/data/ai-model'
import { Results } from 'src/app/data/results'
import { AbstractPaperlessService } from './abstract-paperless-service'

@Injectable({
  providedIn: 'root',
})
export class AiModelService extends AbstractPaperlessService<AiModel> {
  constructor() {
    super()
    this.resourceName = 'ai_models'
  }

  listAllModels(): Observable<Results<AiModel> | AiModel[]> {
    // 直接调用 HTTP 请求，兼容数组和 Results 格式
    // 后端可能返回数组格式 [{...}] 或 Results 格式 {results: [...]}
    return this.http.get<Results<AiModel> | AiModel[]>(
      this.getResourceUrl()
    )
  }
}


