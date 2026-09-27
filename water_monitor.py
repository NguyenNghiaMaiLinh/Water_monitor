import cv2
import os
from urllib.parse import quote

# Ép dùng TCP qua FFmpeg
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp;timeout;5000000"

# Cấu hình thông tin camera
LOCAL_CAMERA_IP = "113.161.131.27"
CAMERA_PORT = 1024
USERNAME = "admin"
PASSWORD = "MThuythinh2026@"  # Mật khẩu gốc của bạn

# Mã hóa ký tự đặc biệt trong mật khẩu (dấu @ sẽ thành %40)
encoded_password = quote(PASSWORD)

# Tạo chuỗi RTSP chuẩn xác
RTSP_URL = f"rtsp://{USERNAME}:{encoded_password}@{LOCAL_CAMERA_IP}:{CAMERA_PORT}/Streaming/Channels/102"

print(f"Đang kết nối tới camera IP: {LOCAL_CAMERA_IP}...")
cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)

if not cap.isOpened():
    print("❌ Lỗi: Không thể mở kết nối tới camera!")
    print("👉 Hãy kiểm tra lại: Máy tính và Camera có đang kết nối chung mạng WiFi/LAN không?")
    exit()

print("✅ Kết nối thành công! Đang mở cửa sổ camera... Nhấn phím 'q' để thoát.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Mất tín hiệu khung hình từ camera...")
        continue

    # Hiển thị khung hình
    cv2.imshow("Water Monitor - Camera Local", frame)

    # Nhấn 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()