import { Button } from '@/components/ui/button'

type Props = {
  text: string
  disabled?: boolean
  onSave: () => void
}

export function SaveAnnotationsButton({ text, disabled, onSave }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onSave}
      disabled={disabled}
      className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
    >
      {text}
    </Button>
  )
}
