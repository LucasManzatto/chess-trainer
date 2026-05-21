import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AuthView } from '@neondatabase/neon-js/auth/react/ui'

export function LoginModal() {
  const { modal } = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const open = modal === 'login'

  function close() {
    navigate({ to: '.', search: (prev) => ({ ...prev, modal: undefined }), replace: true })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) close() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm focus:outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Sign in</Dialog.Title>
          <AuthView pathname="sign-in" redirectTo="/" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
