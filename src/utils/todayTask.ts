import type { TodayTask } from '@/models/api/Modules'

const normalize = (value: string) => value.replace(/[\s_-]/g, '').toLowerCase()

export const isTodayTaskDeferred = (task: TodayTask) => ['upcoming', 'unavailable'].includes(normalize(task.state))
