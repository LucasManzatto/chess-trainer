import { useDrillTab } from './useDrillTab'
import { DrillQueue } from './DrillQueue'
import { DrillBoard } from './DrillBoard'
import { DrillGrading } from './DrillGrading'

export function DrillTab() {
  const { isLoggedIn, queue, isLoading, state, dispatch, config, flash, handleGrade } = useDrillTab()

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-gray-400">Sign in to use the drill queue</p>
          <a href="/?modal=login" className="text-amber-400 hover:underline text-sm">Sign in →</a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading…</div>
  }

  if (state.phase === 'queue') {
    return <DrillQueue queue={queue} onStart={item => dispatch({ type: 'start', item })} />
  }

  if (state.phase === 'drilling') {
    return (
      <DrillBoard
        item={state.item}
        moveIndex={state.moveIndex}
        config={config}
        flash={flash}
        onBack={() => dispatch({ type: 'back_to_queue' })}
      />
    )
  }

  if (state.phase === 'grading') {
    return <DrillGrading item={state.item} onGrade={handleGrade} />
  }

  return null
}
