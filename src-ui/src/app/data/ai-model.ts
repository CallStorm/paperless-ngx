import { ObjectWithId } from './object-with-id'

export type ModelArgType = 'number' | 'string' | 'json'

export interface ModelArg {
  key: string
  val?: string | number
  type: ModelArgType
  range?: string
  label?: string
}

export interface ModelOption {
  name: string
  api_domain?: string
  args?: ModelArg[]
}

export interface SupplierModelConfigEntry {
  api_domain: string
  common_args?: ModelArg[]
  model_options: ModelOption[]
}

export interface SupplierConfig {
  id: number
  /** 供应商编码，如 deepseek / openai / kimi 等，对应后端 supplier 字段 */
  code: string
  name: string
  i18nKey: string
  icon?: any
  type?: string
  is_private?: boolean
  model_config: Record<number, SupplierModelConfigEntry>
}

export interface AiModel extends ObjectWithId {
  name: string
  /** 对应 SupplierConfig.code */
  supplier: string
  model_type: string
  base_model: string
  api_domain: string
  api_key?: string
  params?: ModelArg[]
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export const SUPPLIER_ALIBABA_CLOUD_BAILIAN = 'alibaba_cloud_bailian'
export const SUPPLIER_DEEPSEEK = 'deepseek'
export const SUPPLIER_OPENAI = 'openai'
export const SUPPLIER_KIMI = 'kimi'
export const SUPPLIER_VOLCANO_ENGINE = 'volcano_engine'
export const SUPPLIER_GENERIC_OPENAI = 'generic_openai'

export const supplierList: SupplierConfig[] = [
  {
    id: 1,
    code: SUPPLIER_ALIBABA_CLOUD_BAILIAN,
    name: '阿里云百炼',
    i18nKey: 'supplier.alibaba_cloud_bailian',
    model_config: {
      0: {
        api_domain: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        common_args: [
          { key: 'temperature', val: 1.0, type: 'number', range: '[0, 2)' },
          {
            key: 'extra_body',
            val: '{"enable_thinking": false}',
            type: 'json',
          },
        ],
        model_options: [
          { name: 'qwen3-coder-plus' },
          { name: 'qwen3-coder-flash' },
          { name: 'qwen-plus' },
          { name: 'qwen-max' },
          { name: 'qwen-max-latest' },
          { name: 'qwen-turbo' },
          { name: 'qwen-turbo-latest' },
          { name: 'qwen-long' },
          { name: 'qwen-long-latest' },
        ],
      },
    },
  },
  {
    id: 3,
    code: SUPPLIER_DEEPSEEK,
    name: 'DeepSeek',
    i18nKey: 'supplier.deepseek',
    model_config: {
      0: {
        api_domain: 'https://api.deepseek.com',
        model_options: [
          { name: 'deepseek-chat' },
          // { name: 'deepseek-reasoner' },
        ],
      },
    },
  },
  {
    id: 7,
    code: SUPPLIER_OPENAI,
    name: 'OpenAI',
    i18nKey: 'supplier.openai',
    model_config: {
      0: {
        api_domain: 'https://api.openai.com/v1',
        common_args: [
          { key: 'temperature', val: 1.0, type: 'number', range: '[0, 2]' },
        ],
        model_options: [
          { name: 'gpt-4.1' },
          { name: 'gpt-4.1-mini' },
          { name: 'gpt-4.1-nano' },
          { name: 'gpt-4o' },
          { name: 'gpt-4o-mini' },
          { name: 'chatgpt-4o' },
          { name: 'o4-mini' },
          { name: 'o4-mini-deep-research' },
          { name: 'o3' },
          { name: 'o3-pro' },
          { name: 'o3-mini' },
          { name: 'o3-deep-research' },
          { name: 'o1' },
          { name: 'o1-pro' },
          { name: 'o1-mini' },
        ],
      },
    },
  },
  {
    id: 8,
    code: SUPPLIER_KIMI,
    name: 'Kimi',
    i18nKey: 'supplier.kimi',
    model_config: {
      0: {
        api_domain: 'https://api.moonshot.cn/v1',
        common_args: [
          { key: 'temperature', val: 0.3, type: 'number', range: '[0, 1]' },
        ],
        model_options: [
          {
            name: 'kimi-k2-0711-preview',
            args: [
              { key: 'temperature', val: 0.3, type: 'number', range: '[0, 1]' },
            ],
          },
          {
            name: 'kimi-k2-turbo-preview',
            args: [
              { key: 'temperature', val: 0.3, type: 'number', range: '[0, 1]' },
            ],
          },
          { name: 'moonshot-v1-8k' },
          { name: 'moonshot-v1-32k' },
          { name: 'moonshot-v1-128k' },
          { name: 'moonshot-v1-auto' },
          { name: 'kimi-latest' },
          { name: 'moonshot-v1-8k-vision-preview' },
          { name: 'moonshot-v1-32k-vision-preview' },
          { name: 'moonshot-v1-128k-vision-preview' },
          { name: 'kimi-thinking-preview' },
        ],
      },
    },
  },
  {
    id: 10,
    code: SUPPLIER_VOLCANO_ENGINE,
    name: '火山引擎',
    i18nKey: 'supplier.volcano_engine',
    model_config: {
      0: {
        api_domain: 'https://ark.cn-beijing.volces.com/api/v3',
        common_args: [
          { key: 'temperature', val: 0.6, type: 'number', range: '[0, 1]' },
        ],
        model_options: [
          { name: 'doubao-seed-1-6-250615' },
          { name: 'doubao-seed-1-6-flash-250715' },
          { name: 'doubao-1-5-pro-32k-character-250715' },
          { name: 'kimi-k2-250711' },
          { name: 'deepseek-v3-250324' },
          { name: 'deepseek-r1' },
        ],
      },
    },
  },
  {
    id: 15,
    code: SUPPLIER_GENERIC_OPENAI,
    name: '通用OpenAI',
    i18nKey: 'supplier.generic_openai',
    is_private: true,
    model_config: {
      0: {
        api_domain: 'http://127.0.0.1:8000/v1',
        common_args: [
          { key: 'temperature', val: 0.6, type: 'number', range: '[0, 1]' },
        ],
        model_options: [
          { name: 'gpt-4.1' },
          { name: 'gpt-4.1-mini' },
          { name: 'gpt-4.1-nano' },
          { name: 'gpt-4o' },
          { name: 'gpt-4o-mini' },
          { name: 'chatgpt-4o' },
          { name: 'o4-mini' },
          { name: 'o4-mini-deep-research' },
          { name: 'o3' },
          { name: 'o3-pro' },
          { name: 'o3-mini' },
          { name: 'o3-deep-research' },
          { name: 'o1' },
          { name: 'o1-pro' },
          { name: 'o1-mini' },
        ],
      },
    },
  },
]

export const getSupplierByCode = (code: string): SupplierConfig | undefined => {
  return supplierList.find((s) => s.code === code)
}

export const base_model_options = (
  supplierCode: string,
  model_type: number = 0
) => {
  const supplier = getSupplierByCode(supplierCode)
  if (!supplier) return []
  return supplier.model_config[model_type]?.model_options || []
}



