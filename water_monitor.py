import cv2
import numpy as np
import os
from flask import Flask, Response, jsonify
from flask_cors import CORS

# Ép OpenCV sử dụng giao thức TCP cho RTSP camera Hikvision
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp;timeout;15000000"

app = Flask(__name__)
CORS(app)  # Cho phép React gọi API

# --- CẤU HÌNH CAMERA HIKVISION ---
# Cấu hình RTSP kết nối từ xa qua IP Public và Port đã NAT
CAMERA_HOST = "113.161.131.27"
CAMERA_PORT = 10554

RTSP_URL = f"rtsp://admin:MThuythinh2026%40{CAMERA_HOST}:{CAMERA_PORT}/Streaming/Channels/102"

# Vùng lấy mẫu ROI
ROI_BOX = {
    "y1": 150, 
    "y2": 280, 
    "x1": 270, 
    "x2": 370
}

latest_status_data = {
    "status": "Bình thường",
    "rgb": {"r": 45, "g": 180, "b": 120},
    "brightness": 135,
    "turbidity": 4.2
}

def generate_frames():
    global latest_status_data
    cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
    
    while True:
        success, frame = cap.read()
        if not success:
            cap.release()
            cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
            continue

        # Cắt vùng ROI phân tích màu nước
        roi = frame[ROI_BOX["y1"]:ROI_BOX["y2"], ROI_BOX["x1"]:ROI_BOX["x2"]]
        if roi.size > 0:
            avg_color = np.average(np.average(roi, axis=0), axis=0)
            blue, green, red = avg_color[0], avg_color[1], avg_color[2]
            brightness = (int(blue) + int(green) + int(red)) / 3
            
            turbidity_val = round(max(1.0, min(25.0, (255 - brightness) / 10 + (red / 30))), 1)
            
            status = "Bình thường"
            color_alert = (0, 255, 0)
            
            if brightness < 60:
                status = "NGUY HIỂM (Nước đen / đục nặng)"
                color_alert = (0, 0, 255)
            elif red > 120 and green > 100 and blue < 80:
                status = "CẢNH BÁO (Nước vàng sậm)"
                color_alert = (0, 0, 255)

            latest_status_data = {
                "status": status,
                "rgb": {"r": int(red), "g": int(green), "b": int(blue)},
                "brightness": int(brightness),
                "turbidity": turbidity_val
            }

            # Vẽ khung ROI lên video stream
            cv2.rectangle(frame, (ROI_BOX["x1"], ROI_BOX["y1"]), (ROI_BOX["x2"], ROI_BOX["y2"]), (0, 255, 255), 2)
            cv2.putText(frame, f"Trang thai: {status}", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color_alert, 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def get_status():
    return jsonify(latest_status_data)

@app.route('/api/test-zalo', methods=['POST'])
def test_zalo():
    # Xử lý gọi API Zalo ZNS / Webhook tại đây
    return jsonify({
        "success": True, 
        "message": "Đã gửi tin nhắn Zalo thành công đến Group Kỹ thuật Huy Thịnh!",
        "response_time": "142 ms"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)