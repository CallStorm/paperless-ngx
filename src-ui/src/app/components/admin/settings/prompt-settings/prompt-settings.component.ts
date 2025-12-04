import { AsyncPipe, NgIf } from '@angular/common'
import {
  Component,
  OnInit,
  inject,
} from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms'
import { Prompt, PromptService } from 'src/app/services/rest/prompt.service'
import { ToastService } from 'src/app/services/toast.service'

@Component({
  selector: 'pngx-prompt-settings',
  templateUrl: './prompt-settings.component.html',
  styleUrls: ['./prompt-settings.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, AsyncPipe],
})
export class PromptSettingsComponent implements OnInit {
  private promptService = inject(PromptService)
  private toastService = inject(ToastService)
  private fb = inject(FormBuilder)

  loading = false
  saving = false

  docReadPrompt: Prompt = null
  vlmPrompt: Prompt = null

  form: FormGroup = this.fb.group({
    docRead: [''],
    vlmAnalysisImage: [''],
  })

  ngOnInit(): void {
    this.loadPrompts()
  }

  private loadPrompts(): void {
    this.loading = true
    this.promptService.listAllPrompts().subscribe({
      next: (prompts) => {
        this.docReadPrompt = prompts.find((p) => p.type === 'DOC_READ') || null
        this.vlmPrompt =
          prompts.find((p) => p.type === 'VLM_ANALYSIS_IMAGE') || null

        this.form.patchValue({
          docRead: this.docReadPrompt?.content || '',
          vlmAnalysisImage: this.vlmPrompt?.content || '',
        })

        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.toastService.showError($localize`Error loading prompts`, err)
      },
    })
  }

  onSave(): void {
    if (this.saving) return
    this.saving = true

    const { docRead, vlmAnalysisImage } = this.form.getRawValue()

    const requests = []
    requests.push(
      this.promptService.upsertPrompt(
        'DOC_READ',
        docRead || '',
        this.docReadPrompt
      )
    )
    requests.push(
      this.promptService.upsertPrompt(
        'VLM_ANALYSIS_IMAGE',
        vlmAnalysisImage || '',
        this.vlmPrompt
      )
    )

    let completed = 0

    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++
          if (completed === requests.length) {
            this.saving = false
            this.toastService.showInfo(
              $localize`Prompts were saved successfully.`
            )
            this.loadPrompts()
          }
        },
        error: (err) => {
          this.saving = false
          this.toastService.showError($localize`Error saving prompts`, err)
        },
      })
    })
  }
}


