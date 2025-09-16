export const userRegisterService = async (userData) => {
  try {
    // Thay đổi URL này nếu backend của bạn chạy ở địa chỉ/cổng khác
    const response = await fetch(`${import.meta.env.VITE_API_URL}/user/register`, { // Giả định endpoint là /api/register
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Xử lý các lỗi HTTP (status code không phải 2xx)
      const error = new Error(data.message || 'Đăng ký thất bại');
      error.status = response.status;
      throw error;
    }

    // Trả về dữ liệu khi đăng ký thành công (bao gồm user, accessToken, refreshToken)
    return data;

  } catch (error) {
    console.error("Error during user registration API call:", error);
    throw error; // Rethrow the error so the component can handle it
  }
};