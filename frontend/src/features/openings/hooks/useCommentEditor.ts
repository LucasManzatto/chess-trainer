import { useState } from 'react'

// Shared expand/edit/commit behavior for an annotation's comment field. A row starts expanded
// and in edit mode when it has no comment yet; once it has text, it starts collapsed and
// read-only until clicked. Resets whenever `comment` changes underneath it (e.g. after an
// external update, or when a LineRow's `first` member swaps out) — tracked via the "adjust
// state during render" pattern instead of an effect, so the reset lands in the same commit
// instead of triggering a second render (see https://react.dev/learn/you-might-not-need-an-effect).
export function useCommentEditor(comment: string | null, onChange: (comment: string | null) => void) {
  const [prevComment, setPrevComment] = useState(comment)
  const [expanded, setExpanded] = useState(!!comment)
  const [editing, setEditing] = useState(!comment)
  const [draft, setDraft] = useState(comment ?? '')

  if (comment !== prevComment) {
    setPrevComment(comment)
    setDraft(comment ?? '')
    setExpanded(!!comment)
    setEditing(!comment)
  }

  function commitComment() {
    const trimmed = draft.trim()
    if (trimmed !== (comment ?? '')) onChange(trimmed || null)
    setEditing(!trimmed)
  }

  const rows = Math.min(8, Math.max(4, draft.split('\n').length))

  return { expanded, setExpanded, editing, setEditing, draft, setDraft, commitComment, rows }
}
