import { apiJava } from '@/lib/axios'
import { UserType, SignupFormValues, ProfileFormValues, AvatarImage, EditProfileFormValues, ChangePasswordFormValues, AddressFormValues } from '@/app/types/user.schema'
import { Client } from '@stomp/stompjs'

export class UserService {
  private static readonly PREFIX = '/user'
  static async signup(userData: SignupFormValues): Promise<UserType> {
    const response = await apiJava.post<UserType>(`${this.PREFIX}/signup`, userData)
    return response.data
  }

  static async getProfile(userId: number): Promise<UserType> {
    const response = await apiJava.get<UserType>(`${this.PREFIX}/profile/${userId}`)
    return response.data
  }

  static async saveEdit(userData: ProfileFormValues): Promise<UserType> {
    const response = await apiJava.post<UserType>(`${this.PREFIX}/saveEdit`, userData)
    return response.data
  }

  static async updateProfile(userData: EditProfileFormValues): Promise<UserType> {
    const response = await apiJava.post<UserType>(`${this.PREFIX}/edit-profile`, userData)
    return response.data
  }

  static async changePassword(passwordData: ChangePasswordFormValues): Promise<void> {
    const response = await apiJava.post<void>(`${this.PREFIX}/change-password`, passwordData)
    return response.data
  }

  static async getAddresses(): Promise<AddressFormValues[]> {
    const response = await apiJava.get<AddressFormValues[]>(`${this.PREFIX}/address`)
    return response.data
  }

  static async addAddress(addressData: AddressFormValues): Promise<AddressFormValues> {
    const response = await apiJava.post<AddressFormValues>(`${this.PREFIX}/address/add`, addressData)
    return response.data
  }

  static async updateAddress(id: number, addressData: AddressFormValues): Promise<AddressFormValues> {
    const response = await apiJava.put<AddressFormValues>(`${this.PREFIX}/address/${id}`, addressData)
    return response.data
  }

  static async deleteAddress(id: number): Promise<void> {
    await apiJava.delete<void>(`${this.PREFIX}/address/${id}`)
  }

  static async setDefaultAddress(id: number): Promise<void> {
    await apiJava.post<void>(`${this.PREFIX}/address/${id}/set-default`)
  }

  static async getAll(): Promise<UserType[]> {
    const response = await apiJava.get<UserType[]>(`${this.PREFIX}/getAll`)
    return response.data
  }

  static async uploadAvatar(body: FormData): Promise<AvatarImage> {
    const response = await apiJava.post<AvatarImage>(`${this.PREFIX}/upload-avatar`, body, {
      headers: { 'Content-Type': undefined }
    })
    return response.data
  }

  static connectUser = (stompClient: Client, user: UserType) => {
    if (stompClient.connected) {
      stompClient.publish({
        destination: '/app/user.connectUser',
        body: JSON.stringify(user)
      })
    }
  }

  static disconnectUser = (stompClient: Client, user: UserType) => {
    if (stompClient.connected) {
      stompClient.publish({
        destination: '/app/user.disconnectUser',
        body: JSON.stringify(user)
      })
    }
  }
}


