import { apiJava } from "@/lib/axios";
import {
  UserType,
  SignupFormValues,
  ProfileFormValues,
  AvatarImage,
  EditProfileFormValues,
  ChangePasswordFormValues,
  AddressFormValues,
} from "@/app/types/user.schema";
import { Client } from "@stomp/stompjs";

export class UserService {
   private static readonly PREFIX = "/users";
  private static getConfig() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  }

  static async signup(userData: SignupFormValues): Promise<UserType> {
    const response = await apiJava.post<UserType>(
      `${this.PREFIX}/signup`,
      userData,
    );
    return response.data;
  }

  static async getProfile(userId: number): Promise<UserType> {
    const response = await apiJava.get<UserType>(
      `${this.PREFIX}/profile/${userId}`,
      this.getConfig() // <--- Gắn token
    );
    return response.data;
  }

  static async saveEdit(userData: ProfileFormValues): Promise<UserType> {
    const response = await apiJava.post<UserType>(
      `${this.PREFIX}/saveEdit`,
      userData,
      this.getConfig() // <--- Gắn token
    );
    return response.data;
  }

  // ✅ Đã sửa: Gắn token để người dùng có thể lưu thông tin Profile
  static async updateProfile(
    userData: EditProfileFormValues,
  ): Promise<UserType> {
    const response = await apiJava.post<UserType>(
      `${this.PREFIX}/edit-profile`,
      userData,
      this.getConfig()
    );
    return response.data;
  }

  // ✅ Đã sửa: Gắn token để đổi mật khẩu thành công
  static async changePassword(
    passwordData: ChangePasswordFormValues,
  ): Promise<void> {
    const response = await apiJava.post<void>(
      `${this.PREFIX}/change-password`,
      passwordData,
      this.getConfig()
    );
    return response.data;
  }

  static async getAddresses(): Promise<AddressFormValues[]> {
    const response = await apiJava.get<AddressFormValues[]>(
      `${this.PREFIX}/address`,
      this.getConfig()
    );
    return response.data;
  }

  static async addAddress(
    addressData: AddressFormValues,
  ): Promise<AddressFormValues> {
    const response = await apiJava.post<AddressFormValues>(
      `${this.PREFIX}/address/add`,
      addressData,
      this.getConfig()
    );
    return response.data;
  }

  static async updateAddress(
    id: number,
    addressData: AddressFormValues,
  ): Promise<AddressFormValues> {
    const response = await apiJava.put<AddressFormValues>(
      `${this.PREFIX}/address/${id}`,
      addressData,
      this.getConfig()
    );
    return response.data;
  }

  static async deleteAddress(id: number): Promise<void> {
    await apiJava.delete<void>(
      `${this.PREFIX}/address/${id}`,
      this.getConfig()
    );
  }

  static async setDefaultAddress(id: number): Promise<void> {
    await apiJava.post<void>(
      `${this.PREFIX}/address/${id}/set-default`,
      {}, // data rỗng
      this.getConfig()
    );
  }

  static async getAll(): Promise<UserType[]> {
    const response = await apiJava.get<UserType[]>(
      `${this.PREFIX}/getAll`,
      this.getConfig()
    );
    return response.data;
  }

  static async uploadAvatar(body: FormData): Promise<AvatarImage> {
    const config = this.getConfig();
    const response = await apiJava.post<AvatarImage>(
      `${this.PREFIX}/upload-avatar`,
      body,
      {
        headers: {
          ...config.headers,
          // Axios sẽ tự động set Content-Type là multipart/form-data khi body là FormData
        },
      },
    );
    return response.data;
  }

  // --- WebSocket Stomp ---
  static connectUser = (stompClient: Client, user: UserType) => {
    if (stompClient.connected) {
      stompClient.publish({
        destination: "/app/user.connectUser",
        body: JSON.stringify(user),
      });
    }
  };

  static disconnectUser = (stompClient: Client, user: UserType) => {
    if (stompClient.connected) {
      stompClient.publish({
        destination: "/app/user.disconnectUser",
        body: JSON.stringify(user),
      });
    }
  };
}