import { useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api'
import { gamesKeys } from '../api/queryKeys'
import type { UserProfile } from '../types'

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: gamesKeys.profile(),
    queryFn: ({ signal }) => profileApi.get(signal),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  async function update(username: string) {
    const updated = await profileApi.update(username)
    qc.setQueryData(gamesKeys.profile(), updated)
    return updated
  }
  return { update }
}
