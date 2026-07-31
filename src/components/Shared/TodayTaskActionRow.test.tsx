import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TodayTask } from '@/models/api/Modules'
import { useTodayModule } from '@/hooks/useTodayModule'
import { TodayTaskActionRow } from './TodayTaskActionRow'

const service = vi.hoisted(() => ({ today: vi.fn(), complete: vi.fn(), undo: vi.fn() }))

vi.mock('@/services', () => ({
	moduleService: {
		today: service.today,
		completeTodayOccurrence: service.complete,
		undoTodayOccurrence: service.undo,
	},
}))

const unavailableTask: TodayTask = {
	occurrenceId: 'occurrence-1',
	id: 'task-1',
	title: 'Later task',
	zoneName: 'Kitchen',
	scope: 'Household',
	state: 'Unavailable',
	occurrenceStatus: 'Pending',
	occurrenceDate: '2026-07-31',
	availableFromTime: '21:00:00',
	availableUntilTime: null,
	recommendedTime: null,
	assignmentMode: 'Any',
	assigneeIds: [],
	assigneeNames: [],
	timeZoneId: 'UTC',
	recurrenceType: 'Daily',
}

describe('unavailable Today tasks', () => {
	beforeEach(() => {
		service.today.mockResolvedValue({
			date: '2026-07-31',
			scope: 'Household',
			progress: { total: 1, done: 0, missed: 0, notApplicable: 0, pending: 1 },
			tasks: [unavailableTask],
		})
	})

	it('mutes only task content, disables completion, and keeps details usable', async () => {
		const user = userEvent.setup()
		const onAction = vi.fn()
		const { container } = render(<TodayTaskActionRow task={unavailableTask} pending={false} onAction={onAction} />)

		expect(screen.getByRole('checkbox', { name: 'Complete Later task' })).toBeDisabled()
		expect(container.querySelector('.today-action-row')).toHaveClass('is-deferred')
		const details = screen.getByRole('button', { name: 'View details for Later task' })
		expect(details).toBeEnabled()
		await user.click(details)
		expect(screen.getByRole('dialog', { name: 'Later task' })).toBeInTheDocument()
		expect(onAction).not.toHaveBeenCalled()
	})

	it('guards the module action even when called programmatically', async () => {
		const { result } = renderHook(() => useTodayModule('2026-07-31', 'UTC', false))
		await waitFor(() => expect(result.current.data).not.toBeNull())

		await act(async () => result.current.runAction(unavailableTask, 'complete'))

		expect(service.complete).not.toHaveBeenCalled()
		expect(service.undo).not.toHaveBeenCalled()
	})

	it('also disables an Upcoming task while keeping its details available', () => {
		const upcomingTask = { ...unavailableTask, occurrenceId: 'occurrence-2', state: 'Upcoming' }
		const { container } = render(<TodayTaskActionRow task={upcomingTask} pending={false} onAction={vi.fn()} />)

		expect(screen.getByRole('checkbox', { name: 'Complete Later task' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'View details for Later task' })).toBeEnabled()
		expect(container.querySelector('.today-action-row')).toHaveClass('is-deferred')
	})
})
