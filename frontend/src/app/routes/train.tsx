import { createFileRoute } from '@tanstack/react-router'
import { TrainSession } from '../../features/train/components/TrainSession'

export const Route = createFileRoute('/train')({
  component: TrainSession,
})
