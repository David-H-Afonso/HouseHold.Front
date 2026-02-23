import { useState } from 'react'
import { homeService } from '@/services'
import { useApiCall } from '@/hooks/useApiCall'
import { ApiResultPanel } from '../elements/ApiResultPanel'
import { ScheduleType, TimeOfDaySlot, IssueStatus, IssuePriority } from '@/models/api/Home'
import type { TodayTasksResponse, TaskInstanceDto } from '@/models/api/Home'

export const HomeSection = () => {
	// ── Rooms ────────────────────────────────────────────────────────────
	const [roomName, setRoomName] = useState('')
	const [roomIcon, setRoomIcon] = useState('')
	const [roomId, setRoomId] = useState('')
	const [roomsListState, roomsListActions] = useApiCall()
	const [roomCreateState, roomCreateActions] = useApiCall()
	const [roomGetState, roomGetActions] = useApiCall()
	const [roomDeleteState, roomDeleteActions] = useApiCall()

	// ── Task templates ───────────────────────────────────────────────────
	const [tmplTitle, setTmplTitle] = useState('')
	const [tmplSchedule, setTmplSchedule] = useState<ScheduleType>(ScheduleType.Daily)
	const [tmplSlot, setTmplSlot] = useState<TimeOfDaySlot>(TimeOfDaySlot.Anytime)
	const [tmplListState, tmplListActions] = useApiCall()
	const [tmplCreateState, tmplCreateActions] = useApiCall()
	const [tmplDeleteState, tmplDeleteActions] = useApiCall()
	const [tmplId, setTmplId] = useState('')

	// ── Today tasks ──────────────────────────────────────────────────────
	const [todayState, todayActions] = useApiCall<TodayTasksResponse>()
	const [instanceId, setInstanceId] = useState('')
	const [completeState, completeActions] = useApiCall<TaskInstanceDto>()

	// ── Issues ───────────────────────────────────────────────────────────
	const [issueTitle, setIssueTitle] = useState('')
	const [issuePriority, setIssuePriority] = useState<IssuePriority>(IssuePriority.Medium)
	const [issueId, setIssueId] = useState('')
	const [issueNewStatus, setIssueNewStatus] = useState<IssueStatus>(IssueStatus.Done)
	const [issuesListState, issuesListActions] = useApiCall()
	const [issueCreateState, issueCreateActions] = useApiCall()
	const [issueGetState, issueGetActions] = useApiCall()
	const [issueUpdateState, issueUpdateActions] = useApiCall()
	const [issueDeleteState, issueDeleteActions] = useApiCall()

	return (
		<section className='pg-section'>
			<h2 className='pg-section__title'>F) Home</h2>

			{/* ── ROOMS ────────────────────────────────────────────────── */}
			<details className='pg-subsection' open>
				<summary>
					<strong>Rooms</strong>
				</summary>

				<div className='pg-form'>
					<h3>GET /rooms</h3>
					<button
						onClick={() => roomsListActions.call(() => homeService.listRooms())}
						disabled={roomsListState.loading}>
						List rooms
					</button>
					<ApiResultPanel state={roomsListState} label='GET /rooms' />
				</div>

				<div className='pg-form'>
					<h3>POST /rooms</h3>
					<div className='pg-form__row'>
						<label>Name</label>
						<input
							value={roomName}
							onChange={(e) => setRoomName(e.target.value)}
							placeholder='Cocina'
						/>
					</div>
					<div className='pg-form__row'>
						<label>Icon (emoji)</label>
						<input
							value={roomIcon}
							onChange={(e) => setRoomIcon(e.target.value)}
							placeholder='🍳'
						/>
					</div>
					<button
						onClick={() =>
							roomCreateActions.call(
								() => homeService.createRoom({ name: roomName, icon: roomIcon || undefined }),
								{ name: roomName }
							)
						}
						disabled={roomCreateState.loading}>
						Create room
					</button>
					<ApiResultPanel state={roomCreateState} label='POST /rooms' />
				</div>

				<div className='pg-form'>
					<h3>GET | DELETE /rooms/:id</h3>
					<div className='pg-form__row'>
						<label>Room ID</label>
						<input
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							placeholder='xxxxxxxx-...'
						/>
					</div>
					<div className='pg-form__buttons'>
						<button
							onClick={() => roomGetActions.call(() => homeService.getRoom(roomId))}
							disabled={roomGetState.loading || !roomId}>
							Get
						</button>
						<button
							onClick={() =>
								roomDeleteActions.call(() => homeService.deleteRoom(roomId), { id: roomId })
							}
							disabled={roomDeleteState.loading || !roomId}
							className='btn--danger'>
							Delete
						</button>
					</div>
					<ApiResultPanel state={roomGetState} label='GET /rooms/:id' />
					<ApiResultPanel state={roomDeleteState} label='DELETE /rooms/:id' />
				</div>
			</details>

			{/* ── TASK TEMPLATES ───────────────────────────────────────── */}
			<details className='pg-subsection'>
				<summary>
					<strong>Task Templates</strong>
				</summary>

				<div className='pg-form'>
					<h3>GET /task-templates</h3>
					<button
						onClick={() => tmplListActions.call(() => homeService.listTaskTemplates())}
						disabled={tmplListState.loading}>
						List templates
					</button>
					<ApiResultPanel state={tmplListState} label='GET /task-templates' />
				</div>

				<div className='pg-form'>
					<h3>POST /task-templates</h3>
					<div className='pg-form__row'>
						<label>Title</label>
						<input
							value={tmplTitle}
							onChange={(e) => setTmplTitle(e.target.value)}
							placeholder='Limpiar cocina'
						/>
					</div>
					<div className='pg-form__row'>
						<label>Schedule</label>
						<select
							value={tmplSchedule}
							onChange={(e) => setTmplSchedule(e.target.value as ScheduleType)}>
							{Object.values(ScheduleType).map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</div>
					<div className='pg-form__row'>
						<label>Slot</label>
						<select value={tmplSlot} onChange={(e) => setTmplSlot(e.target.value as TimeOfDaySlot)}>
							{Object.values(TimeOfDaySlot).map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</div>
					<button
						onClick={() => {
							const b = { title: tmplTitle, scheduleType: tmplSchedule, timeOfDaySlot: tmplSlot }
							tmplCreateActions.call(() => homeService.createTaskTemplate(b), b)
						}}
						disabled={tmplCreateState.loading}>
						Create template
					</button>
					<ApiResultPanel state={tmplCreateState} label='POST /task-templates' />
				</div>

				<div className='pg-form'>
					<h3>DELETE /task-templates/:id</h3>
					<div className='pg-form__row'>
						<label>Template ID</label>
						<input
							value={tmplId}
							onChange={(e) => setTmplId(e.target.value)}
							placeholder='xxxxxxxx-...'
						/>
					</div>
					<button
						onClick={() =>
							tmplDeleteActions.call(() => homeService.deleteTaskTemplate(tmplId), { id: tmplId })
						}
						disabled={tmplDeleteState.loading || !tmplId}
						className='btn--danger'>
						Delete
					</button>
					<ApiResultPanel state={tmplDeleteState} label='DELETE /task-templates/:id' />
				</div>
			</details>

			{/* ── TODAY TASKS ──────────────────────────────────────────── */}
			<details className='pg-subsection'>
				<summary>
					<strong>Today's Tasks</strong>
				</summary>

				<div className='pg-form'>
					<h3>GET /tasks/today</h3>
					<button
						onClick={() => todayActions.call(() => homeService.getTodayTasks())}
						disabled={todayState.loading}>
						Get today's tasks
					</button>
					<ApiResultPanel state={todayState} label='GET /tasks/today' />

					{todayState.data && (
						<div className='pg-today'>
							{(['morning', 'evening', 'anytime', 'overdue'] as const).map(
								(slot) =>
									(todayState.data![slot]?.length ?? 0) > 0 && (
										<div key={slot} className='pg-today__group'>
											<h4>
												{slot === 'overdue'
													? '⚠️ Overdue'
													: `🕐 ${slot.charAt(0).toUpperCase() + slot.slice(1)}`}
											</h4>
											<ul>
												{todayState.data![slot].map((t: TaskInstanceDto) => (
													<li key={t.id}>
														<span className={`badge badge--${t.status.toLowerCase()}`}>
															{t.status}
														</span>{' '}
														{t.templateTitle} {t.roomName && `(${t.roomName})`}
														<code style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
															{t.id}
														</code>
													</li>
												))}
											</ul>
										</div>
									)
							)}
						</div>
					)}
				</div>

				<div className='pg-form'>
					<h3>POST /tasks/instances/:id/complete</h3>
					<div className='pg-form__row'>
						<label>Instance ID</label>
						<input
							value={instanceId}
							onChange={(e) => setInstanceId(e.target.value)}
							placeholder='xxxxxxxx-...'
						/>
					</div>
					<button
						onClick={() =>
							completeActions.call(() => homeService.completeTaskInstance(instanceId), {
								id: instanceId,
							})
						}
						disabled={completeState.loading || !instanceId}>
						Complete instance
					</button>
					<ApiResultPanel state={completeState} label='POST /tasks/instances/:id/complete' />
				</div>
			</details>

			{/* ── ISSUES ───────────────────────────────────────────────── */}
			<details className='pg-subsection'>
				<summary>
					<strong>Issues</strong>
				</summary>

				<div className='pg-form'>
					<h3>GET /issues</h3>
					<button
						onClick={() => issuesListActions.call(() => homeService.listIssues())}
						disabled={issuesListState.loading}>
						List issues
					</button>
					<ApiResultPanel state={issuesListState} label='GET /issues' />
				</div>

				<div className='pg-form'>
					<h3>POST /issues</h3>
					<div className='pg-form__row'>
						<label>Title</label>
						<input
							value={issueTitle}
							onChange={(e) => setIssueTitle(e.target.value)}
							placeholder='Grifo cocina gotea'
						/>
					</div>
					<div className='pg-form__row'>
						<label>Priority</label>
						<select
							value={issuePriority}
							onChange={(e) => setIssuePriority(e.target.value as IssuePriority)}>
							{Object.values(IssuePriority).map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</div>
					<button
						onClick={() => {
							const b = { title: issueTitle, priority: issuePriority }
							issueCreateActions.call(() => homeService.createIssue(b), b)
						}}
						disabled={issueCreateState.loading}>
						Create issue
					</button>
					<ApiResultPanel state={issueCreateState} label='POST /issues' />
				</div>

				<div className='pg-form'>
					<h3>GET | PUT (close/reopen) | DELETE /issues/:id</h3>
					<div className='pg-form__row'>
						<label>Issue ID</label>
						<input
							value={issueId}
							onChange={(e) => setIssueId(e.target.value)}
							placeholder='xxxxxxxx-...'
						/>
					</div>
					<div className='pg-form__row'>
						<label>New status (for PUT)</label>
						<select
							value={issueNewStatus}
							onChange={(e) => setIssueNewStatus(e.target.value as IssueStatus)}>
							{Object.values(IssueStatus).map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</div>
					<div className='pg-form__buttons'>
						<button
							onClick={() => issueGetActions.call(() => homeService.getIssue(issueId))}
							disabled={issueGetState.loading || !issueId}>
							Get
						</button>
						<button
							onClick={() => {
								const b = {
									title: issueTitle || '(unchanged)',
									priority: issuePriority,
									status: issueNewStatus,
								}
								issueUpdateActions.call(() => homeService.updateIssue(issueId, b), b)
							}}
							disabled={issueUpdateState.loading || !issueId}>
							Update status → ResolvedAt auto-set
						</button>
						<button
							onClick={() =>
								issueDeleteActions.call(() => homeService.deleteIssue(issueId), { id: issueId })
							}
							disabled={issueDeleteState.loading || !issueId}
							className='btn--danger'>
							Delete
						</button>
					</div>
					<ApiResultPanel state={issueGetState} label='GET /issues/:id' />
					<ApiResultPanel state={issueUpdateState} label='PUT /issues/:id' />
					<ApiResultPanel state={issueDeleteState} label='DELETE /issues/:id' />
				</div>
			</details>
		</section>
	)
}
