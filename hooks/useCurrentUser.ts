import { useQuery } from '@tanstack/react-query'
import { UserType } from '@/app/types/user.schema'
import { AuthService } from '@/app/services/auth.service'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function useCurrentUser() {
  const { setUserDetail, accessToken, setAccessAndRefreshToken } = useAuthStore()

  const { data: token } = useQuery({
    queryKey: ['test'],
    queryFn: () => AuthService.meTokenNext()
  })

  const { data } = useQuery<UserType, Error, UserType>({
    queryKey: ['currentUser', accessToken],
    queryFn: () => AuthService.me(),
    staleTime: 0,
    enabled: !!accessToken,
    refetchOnMount: true
  })

  useEffect(() => {
    if (data) {
      setUserDetail(data)
    }
  }, [data, setUserDetail])

  useEffect(() => {
    if (token) {
      setAccessAndRefreshToken(token)
    }
  }, [token, setUserDetail, setAccessAndRefreshToken])

  return {
    data
  }
}
