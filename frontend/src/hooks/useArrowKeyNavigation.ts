import { useEffect, useRef } from 'react'

export function useArrowKeyNavigation(onLeft: () => void, onRight: () => void) {
  const onLeftRef = useRef(onLeft)
  const onRightRef = useRef(onRight)
  useEffect(() => { onLeftRef.current = onLeft })
  useEffect(() => { onRightRef.current = onRight })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onLeftRef.current() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onRightRef.current() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
