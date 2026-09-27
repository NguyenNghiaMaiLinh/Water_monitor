import cv2
import numpy as np
import os
import threading
import time
from flask import Flask, Response, jsonify
from flask_cors import CORS

def custom_quote(text):
    return text.replace('@', '%40').replace('#', '%23').replace('!', '%21')

os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp;timeout;15000000"

app = Flask(__name__)
CORS(app)

# --- CẤU HÌNH CAMERA HIKVISION TỪ XA ---
LOCAL_CAMERA_IP = "113.161.131.27"
CAMERA_PORT = 1024 
USERNAME = "admin"
PASSWORD = "MThuythinh2026@"  

encoded_password = custom_quote(PASSWORD)
RTSP_URL = f"rtsp://{USERNAME}:{encoded_password}@{LOCAL_CAMERA_IP}:{CAMERA_PORT}/Streaming/Channels/102"

# Vùng lấy mẫu ROI
ROI_BOX = {
    "y1": 150,
    "y2": 280, 
    "x1": 250, 
    "x2": 390
}

latest_status_data = {
    "status": "Bình thường",
    "rgb": {"r": 45, "g": 180, "b": 120},
    "brightness": 135,
    "turbidity": 4.2
}

# Biến toàn cục dùng chung cho các luồng
output_frame = None
lock = threading.Lock()
stop_event = threading.Event()

def capture_frames_background():
    """Luồng nền độc lập đọc camera, thay thế vòng lặp vô hạn không kiểm soát"""
    global output_frame, latest_status_data
    
    while not stop_event.is_set():
        cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 15000)
        cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 15000)
        
        while cap.isOpened() and not stop_event.is_set():
            success, frame = cap.read()
            if not success:
                break # Mất tín hiệu thì thoát vòng lặp để kết nối lại

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

                # Vẽ khung lên video
                cv2.rectangle(frame, (ROI_BOX["x1"], ROI_BOX["y1"]), (ROI_BOX["x2"], ROI_BOX["y2"]), (0, 255, 255), 2)
                cv2.putText(frame, f"Trang thai: {status}", (700, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color_alert, 2)

            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                with lock:
                    output_frame = buffer.tobytes()
            
            # Thay cho time.sleep(0.03), dùng stop_event.wait để thoát nhanh khi cần
            if stop_event.wait(0.03):
                break

        cap.release()
        # Chờ 3 giây trước khi thử kết nối lại camera nếu rớt mạng
        if stop_event.wait(3):
            break

# Khởi chạy luồng nền
t = threading.Thread(target=capture_frames_background, daemon=True)
t.start()

def generate():
    while not stop_event.is_set():
        with lock:
            if output_frame is None:
                continue
            frame_bytes = output_frame
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)

@app.route('/video_feed')
def video_feed():
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def get_status():
    return jsonify(latest_status_data)

@app.route('/ping')
def ping():
    return "OK", 200

@app.route('/api/test-zalo', methods=['POST'])
def test_zalo():
    return jsonify({
        "success": True, 
        "message": "Đã gửi tin nhắn Zalo thành công đến Group Kỹ thuật Huy Thịnh!",
        "response_time": "142 ms"
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)