import { AsyncPipe, NgForOf, NgIf } from '@angular/common'
import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core'
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'
import {
  AiModel,
  ModelArg,
  ModelOption,
  base_model_options,
  getSupplierByCode,
  supplierList,
} from 'src/app/data/ai-model'
import { AiModelService } from 'src/app/services/rest/ai-model.service'
import { ToastService } from 'src/app/services/toast.service'

@Component({
  selector: 'pngx-ai-model-settings',
  templateUrl: './ai-model-settings.component.html',
  styleUrls: ['./ai-model-settings.component.scss'],
  standalone: true,
  imports: [NgForOf, NgIf, AsyncPipe, ReactiveFormsModule],
})
export class AiModelSettingsComponent implements OnInit {
  private aiModelService = inject(AiModelService)
  private toastService = inject(ToastService)
  private fb = inject(FormBuilder)
  private modalService = inject(NgbModal)

  @ViewChild('modelDialog') modelDialogTpl: TemplateRef<any>
  private activeModal?: NgbModalRef

  models: AiModel[] = []
  filteredModels: AiModel[] = []
  loading = false

  supplierList = supplierList

  /** 当前选中的模型类型过滤器 */
  selectedModelTypeFilter: string = 'ALL'

  /** 可选的模型类型 */
  readonly modelTypeOptions: { value: string; label: string }[] = [
    { value: 'llm', label: $localize`Large language model` },
    { value: 'vlm', label: $localize`Vision-language model` },
    { value: 'embedding', label: $localize`Embedding model` },
  ]

  /** 获取所有唯一的模型类型列表（用于过滤标签） */
  get availableModelTypes(): string[] {
    const types = new Set<string>()
    this.models.forEach((model) => {
      if (model.model_type) {
        types.add(model.model_type)
      }
    })
    return Array.from(types).sort()
  }

  /** 当前供应商下可选的基础模型列表 */
  modelOptions: ModelOption[] = []

  selectedModel: AiModel = null

  form: FormGroup = this.fb.group({
    id: new FormControl<number | null>(null),
    name: new FormControl<string>('', [Validators.required]),
    supplier: new FormControl<string>('deepseek', [Validators.required]),
    model_type: new FormControl<string>('llm', [Validators.required]),
    base_model: new FormControl<string>('', [Validators.required]),
    api_domain: new FormControl<string>('', [Validators.required]),
    api_key: new FormControl<string>('', [Validators.required]),
    is_default: new FormControl<boolean>(false),
    params: this.fb.array([]),
  })

  get paramsArray(): FormArray {
    return this.form.get('params') as FormArray
  }

  ngOnInit(): void {
    this.loadModels()
    this.form.get('supplier').valueChanges.subscribe((supplierCode) => {
      this.onSupplierChange(supplierCode)
    })
    this.form.get('base_model').valueChanges.subscribe((modelName) => {
      this.onBaseModelChange(modelName)
    })
  }

  private openDialog(): void {
    if (!this.modelDialogTpl) {
      return
    }
    this.activeModal = this.modalService.open(this.modelDialogTpl, {
      size: 'xl',
      backdrop: 'static',
    })
  }

  private loadModels(): void {
    this.loading = true
    this.aiModelService.listAllModels().subscribe({
      next: (res) => {
        // 兼容两种格式：直接数组或 Results 格式
        if (Array.isArray(res)) {
          this.models = res
        } else if (res && res.results) {
          this.models = res.results
        } else {
          this.models = []
        }
        this.applyFilter()
        this.loading = false
      },
      error: (err) => {
        this.loading = false
        this.toastService.showError($localize`Error loading AI models`, err)
      },
    })
  }

  /** 应用模型类型过滤器 */
  applyFilter(): void {
    if (this.selectedModelTypeFilter === 'ALL') {
      this.filteredModels = this.models
    } else {
      this.filteredModels = this.models.filter(
        (model) => model.model_type === this.selectedModelTypeFilter
      )
    }
  }

  /** 切换模型类型过滤器 */
  onModelTypeFilterChange(filterType: string): void {
    this.selectedModelTypeFilter = filterType
    this.applyFilter()
  }

  /** 获取模型类型的显示标签 */
  getModelTypeLabel(modelType: string): string {
    const option = this.modelTypeOptions.find((opt) => opt.value === modelType)
    return option ? option.label : modelType
  }

  private resetParams(params?: ModelArg[]): void {
    this.paramsArray.clear()
    if (params && params.length) {
      params.forEach((p) => this.addParamRow(p))
    }
  }

  private addParamRow(arg?: ModelArg): void {
    this.paramsArray.push(
      this.fb.group({
        key: new FormControl<string>(arg?.key || '', [Validators.required]),
        val: new FormControl<string | number>(arg?.val ?? ''),
        type: new FormControl<string>(arg?.type || 'number'),
        range: new FormControl<string>(arg?.range || ''),
        label: new FormControl<string>(arg?.label || ''),
      })
    )
  }

  onAddParamRow(): void {
    this.addParamRow()
  }

  onRemoveParamRow(index: number): void {
    this.paramsArray.removeAt(index)
  }

  onSupplierChange(supplierCode: string): void {
    const supplier = getSupplierByCode(supplierCode)
    if (supplier) {
      const config = supplier.model_config[0]
      this.modelOptions = config?.model_options || []
      if (this.modelOptions.length) {
        this.form.get('base_model').setValue(this.modelOptions[0].name)
      } else {
        this.form.get('base_model').setValue('')
      }
      if (config?.api_domain) {
        this.form.get('api_domain').setValue(config.api_domain)
      }
      if (config?.common_args) {
        this.resetParams(config.common_args)
      } else {
        // 如果供应商没有公共参数，清空高级参数
        this.resetParams()
      }
    } else {
      this.modelOptions = []
      this.form.get('base_model').setValue('')
      this.resetParams()
    }
  }

  onBaseModelChange(modelName: string): void {
    const supplierCode = this.form.get('supplier').value as string
    const supplier = getSupplierByCode(supplierCode)
    if (!supplier) {
      return
    }
    const config = supplier.model_config[0]
    const option =
      config?.model_options?.find((o) => o.name === modelName) || null

    if (option?.args && option.args.length) {
      // 模型级别自定义参数
      this.resetParams(option.args)
    } else if (config?.common_args) {
      // 回退到供应商公共参数
      this.resetParams(config.common_args)
    } else {
      // 没有模型参数也没有公共参数，则清空
      this.resetParams()
    }
  }

  onCreate(): void {
    this.selectedModel = null
    const isFirstModel =
      Array.isArray(this.models) ? this.models.length === 0 : true
    this.form.reset({
      id: null,
      name: '',
      supplier: 'deepseek',
      model_type: 'llm',
      base_model: '',
      api_domain: '',
      api_key: '',
      is_default: isFirstModel,
    })
    this.resetParams()
    this.onSupplierChange('deepseek')
  }

  onCreateClick(): void {
    this.onCreate()
    this.openDialog()
  }

  onEdit(model: AiModel): void {
    this.selectedModel = model
    this.form.reset({
      id: model.id,
      name: model.name,
      supplier: model.supplier,
      model_type: model.model_type || 'llm',
      base_model: model.base_model,
      api_domain: model.api_domain,
      api_key: '',
      is_default: model.is_default,
    })
    this.resetParams(model.params || [])
  }

  onEditClick(model: AiModel): void {
    this.onEdit(model)
    this.openDialog()
  }

  onSetDefault(model: AiModel): void {
    const payload: AiModel = { ...model, is_default: true }
    this.aiModelService.patch(payload).subscribe({
      next: () => {
        this.toastService.showInfo(
          $localize`Default AI model was updated successfully.`
        )
        this.loadModels()
      },
      error: (err) => {
        this.toastService.showError(
          $localize`Error updating default AI model`,
          err
        )
      },
    })
  }

  /** 检查模型是否是当前类型的默认模型 */
  isDefaultForType(model: AiModel): boolean {
    if (!model.is_default) {
      return false
    }
    // 检查是否是该类型中唯一的默认模型
    const sameTypeModels = this.models.filter(
      (m) => m.model_type === model.model_type && m.is_default
    )
    return sameTypeModels.length === 1 && sameTypeModels[0].id === model.id
  }

  onDelete(model: AiModel): void {
    if (!confirm($localize`Are you sure you want to delete this model?`)) {
      return
    }
    this.aiModelService.delete(model).subscribe({
      next: () => {
        this.toastService.showInfo(
          $localize`AI model was deleted successfully.`
        )
        this.loadModels()
        if (this.selectedModel?.id === model.id) {
          this.selectedModel = null
        }
      },
      error: (err) => {
        this.toastService.showError($localize`Error deleting AI model`, err)
      },
    })
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const raw = this.form.getRawValue()
    const payload: AiModel = {
      id: raw.id,
      name: raw.name,
      supplier: raw.supplier,
      model_type: raw.model_type,
      base_model: raw.base_model,
      api_domain: raw.api_domain,
      api_key: raw.api_key,
      is_default: raw.is_default,
      params: raw.params,
    }

    const request$ = payload.id
      ? this.aiModelService.update(payload)
      : this.aiModelService.create(payload)

    request$.subscribe({
      next: () => {
        this.toastService.showInfo($localize`AI model was saved successfully.`)
        this.loadModels()
        this.selectedModel = null
        if (this.activeModal) {
          this.activeModal.close()
          this.activeModal = null
        }
        // 如果创建了新模型，自动切换到对应的类型过滤器
        if (!payload.id && payload.model_type) {
          this.onModelTypeFilterChange(payload.model_type)
        }
      },
      error: (err) => {
        this.toastService.showError($localize`Error saving AI model`, err)
      },
    })
  }
}


