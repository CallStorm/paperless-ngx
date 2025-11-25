import { CommonModule, NgClass } from '@angular/common'
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core'
import { Params, Router, RouterModule } from '@angular/router'
import {
  NgbDropdownModule,
  NgbModal,
  NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap'
import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons'
import { filter, first, Subject, takeUntil } from 'rxjs'
import { Tag } from 'src/app/data/tag'
import {
  PermissionAction,
  PermissionType,
  PermissionsService,
} from 'src/app/services/permissions.service'
import { TagService } from 'src/app/services/rest/tag.service'
import { ToastService } from 'src/app/services/toast.service'
import {
  UploadDocumentsService,
  UploadFileOptions,
} from 'src/app/services/upload-documents.service'
import { NavigationEnd } from '@angular/router'
import { TagEditDialogComponent } from '../../common/edit-dialog/tag-edit-dialog/tag-edit-dialog.component'
import { EditDialogMode } from '../../common/edit-dialog/edit-dialog.component'

interface DocumentTreeNode extends Tag {
  depth: number
  expanded: boolean
  children?: DocumentTreeNode[]
}

@Component({
  selector: 'pngx-documents-tree',
  standalone: true,
  templateUrl: './documents-tree.component.html',
  styleUrls: ['./documents-tree.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    NgbDropdownModule,
    NgbPopoverModule,
    NgxBootstrapIconsModule,
    NgClass,
  ],
})
export class DocumentsTreeComponent implements OnInit, OnDestroy {
  @Input() slimSidebarEnabled: boolean = false

  @Output() menuCloseRequested = new EventEmitter<void>()

  nodes: DocumentTreeNode[] = []
  loading: boolean = false
  error: string
  activeTagId?: number
  isDocumentsRoute: boolean = false
  selectedNodeId: number | null = null // null means root Documents is selected
  readonly expandLabel = $localize`Expand`
  readonly collapseLabel = $localize`Collapse`

  private destroy$ = new Subject<void>()
  private expandedNodes = new Set<number>()
  private pendingUploadTagId: number = null

  @ViewChild('uploadInput') uploadInputRef: ElementRef<HTMLInputElement>

  private readonly tagService = inject(TagService)
  private readonly permissionsService = inject(PermissionsService)
  private readonly router = inject(Router)
  private readonly toastService = inject(ToastService)
  private readonly uploadDocumentsService = inject(UploadDocumentsService)
  private readonly modalService = inject(NgbModal)

  ngOnInit(): void {
    this.loadTree()
    this.updateRouteState()
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateRouteState())
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadTree(): void {
    this.loading = true
    this.error = null
    this.tagService
      .listFiltered(1, 1000, 'name', false, null, true, { is_root: true })
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.nodes = this.buildTree(result.results ?? [])
          this.loading = false
        },
        error: (err) => {
          this.error =
            err?.error?.detail ??
            err?.error ??
            $localize`Unable to load directories.`
          this.loading = false
        },
      })
  }

  get canCreateDirectories(): boolean {
    return this.permissionsService.currentUserCan(
      PermissionAction.Add,
      PermissionType.Tag
    )
  }

  get canUploadDocuments(): boolean {
    return this.permissionsService.currentUserCan(
      PermissionAction.Add,
      PermissionType.Document
    )
  }

  canRenameTag(node: DocumentTreeNode): boolean {

    const hasChangePermission = this.permissionsService.currentUserCan(
      PermissionAction.Change,
      PermissionType.Tag
    )
    // Debug log to trace permission evaluation for rename action
    // eslint-disable-next-line no-console
 
    return  hasChangePermission
  }

  canDeleteTag(node: DocumentTreeNode): boolean {
    return (
      this.permissionsService.currentUserCan(
        PermissionAction.Delete,
        PermissionType.Tag
      )
    )
  }

  toggleNode(node: DocumentTreeNode): void {
    if (!node?.children?.length) {
      return
    }
    if (this.expandedNodes.has(node.id)) {
      this.expandedNodes.delete(node.id)
      node.expanded = false
    } else {
      this.expandedNodes.add(node.id)
      node.expanded = true
    }
  }

  onRootNavigate(): void {
    this.selectedNodeId = null
    this.menuCloseRequested.emit()
  }

  onNodeNavigate(nodeId: number): void {
    this.selectedNodeId = nodeId
    this.menuCloseRequested.emit()
  }

  buildQueryParams(tagId?: number): Params {
    const params = this.getBaseQueryParams()
    if (tagId) {
      params['tags__id__all'] = tagId
    } else {
      delete params['tags__id__all']
    }
    return params
  }

  openCreateDirectoryDialog(parent?: DocumentTreeNode): void {
    if (!this.canCreateDirectories) return
    const modalRef = this.modalService.open(TagEditDialogComponent, {
      size: 'lg',
      backdrop: 'static',
    })

    modalRef.componentInstance.dialogMode = EditDialogMode.CREATE
    modalRef.componentInstance.object = {
      parent: parent?.id ?? null,
    } as Tag

    modalRef.componentInstance.succeeded.pipe(first()).subscribe(() => {
      if (parent?.id) {
        this.expandedNodes.add(parent.id)
      }
      this.toastService.showInfo($localize`Directory created.`)
      this.loadTree()
    })
  }

  openRenameDialog(node: DocumentTreeNode): void {
    if (!this.canRenameTag(node)) return
    const modalRef = this.modalService.open(TagEditDialogComponent, {
      size: 'lg',
      backdrop: 'static',
    })
    modalRef.componentInstance.dialogMode = EditDialogMode.EDIT
    modalRef.componentInstance.object = { ...node }
    modalRef.componentInstance.succeeded.pipe(first()).subscribe(() => {
      this.toastService.showInfo($localize`Directory renamed.`)
      this.loadTree()
    })
  }

  deleteNode(node: DocumentTreeNode): void {
    if (!this.canDeleteTag(node)) return
    if (
      !confirm(
        $localize`Do you really want to delete the directory "${node.name}"?`
      )
    ) {
      return
    }
    this.tagService.delete(node).subscribe({
      next: () => {
        this.toastService.showInfo($localize`Directory deleted.`)
        this.expandedNodes.delete(node.id)
        this.loadTree()
      },
      error: (err) => {
        this.toastService.showError(
          $localize`Unable to delete directory.`,
          err
        )
      },
    })
  }

  queueUpload(tagId?: number): void {
    if (!this.canUploadDocuments) return
    this.pendingUploadTagId = tagId ?? null
    if (this.uploadInputRef?.nativeElement) {
      this.uploadInputRef.nativeElement.value = ''
      this.uploadInputRef.nativeElement.click()
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (!input?.files?.length) return
    const files = Array.from(input.files)
    const options: UploadFileOptions = {}
    if (this.pendingUploadTagId) {
      options.tags = [this.pendingUploadTagId]
    }
    this.toastService.showInfo($localize`Initiating upload...`, 3000)
    files.forEach((file) => this.uploadDocumentsService.uploadFile(file, options))
    input.value = ''
    this.pendingUploadTagId = null
  }

  getIndent(depth: number): number {
    const BASE_INDENT = 12
    return Math.max(depth, 0) * BASE_INDENT
  }

  trackByNodeId(_: number, node: DocumentTreeNode): number {
    return node.id
  }

  private buildTree(tags: Tag[], depth: number = 0): DocumentTreeNode[] {
    return (tags ?? []).map((tag) => {
      const { children: rawChildren, ...rest } = tag
      const node: DocumentTreeNode = {
        ...(rest as Tag),
        depth,
        expanded: this.expandedNodes.has(tag.id),
        children: rawChildren?.length
          ? this.buildTree(rawChildren, depth + 1)
          : [],
      }
      return node
    })
  }

  private getBaseQueryParams(): Params {
    const parsedUrl = this.router.parseUrl(this.router.url)
    const params: Params = { ...parsedUrl.queryParams }
    delete params['page']
    delete params['view']
    delete params['tags__id__all']
    delete params['tags__id__in']
    delete params['tags__id__none']
    delete params['is_tagged']
    return params
  }

  private updateRouteState(): void {
    const parsed = this.router.parseUrl(this.router.url)
    const segments =
      parsed?.root?.children?.primary?.segments?.map((s) => s.path) ?? []
    const currentPath = segments.join('/')
    this.isDocumentsRoute =
      currentPath === 'documents' || currentPath.startsWith('documents/')
    const tagParam = parsed.queryParams['tags__id__all']
    const parsedId = tagParam != null ? Number(tagParam) : NaN
    this.activeTagId = Number.isFinite(parsedId) ? parsedId : undefined
    // Sync selectedNodeId with activeTagId
    if (this.activeTagId !== undefined) {
      this.selectedNodeId = this.activeTagId
    } else if (this.isDocumentsRoute) {
      this.selectedNodeId = null
    }
  }
}

