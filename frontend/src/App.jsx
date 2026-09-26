import React, { useState, useEffect } from 'react';

export default function App() {
  const [waterData, setWaterData] = useState({
    status: "Bình thường",
    rgb: { r: 45, g: 180, b: 120 },
    brightness: 135,
    turbidity: 4.2,
    history: [
      { time: "14:15:22", status: "Bình thường", rgb: "R:50 G:175 B:130", turbidity: "3.8", risk: "0.12" },
      { time: "14:10:05", status: "Cảnh báo nhẹ", rgb: "R:110 G:140 B:90", turbidity: "8.5", risk: "0.45" },
      { time: "13:50:11", status: "Bình thường", rgb: "R:48 G:182 B:125", turbidity: "4.1", risk: "0.08" }
    ]
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/status');
        const data = await response.json();
        setWaterData(prev => ({
          ...prev,
          status: data.status,
          rgb: data.rgb,
          brightness: data.brightness,
          turbidity: data.turbidity
        }));
      } catch (error) {
        console.error("Đang kết nối lại với Backend...", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTestZalo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/test-zalo', { method: 'POST' });
      const data = await res.json();
      if(data.success) {
        alert("✅ " + data.message);
      }
    } catch (err) {
      alert("❌ Lỗi kết nối tới Zalo Hub!");
    }
  };

  const isNormal = waterData.status.includes("Bình thường") || waterData.status.includes("Binh thuong");

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconBox}>💧</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={styles.title}>EcoFlow Watcher</h1>
              <span style={styles.badgeIoT}>IoT & AI Vision</span>
            </div>
            <p style={styles.subtitle}>Hệ thống giám sát chất lượng & màu sắc nước thải thời gian thực - Công ty Huy Thịnh</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.onlineBadge}>
            <span style={styles.dot}></span>
            <span>Đang hoạt động (Online)</span>
          </div>
          <button style={styles.configBtn}>⚙️ Cấu hình Zalo & Ngưỡng</button>
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.mainGrid}>
        
        {/* Cột trái */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: 'span 2' }}>
          
          {/* Card Camera */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📹</span>
                <h3 style={styles.cardTitle}>Camera Trạm Xử Lý #03 (Đầu Ra Thải)</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={styles.badgeAI}>AI_MODEL: v4.2-ColorVision</span>
                <span style={{ ...styles.statusTag, background: isNormal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isNormal ? '#34d399' : '#f87171', borderColor: isNormal ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
                  TRẠNG THÁI: {isNormal ? 'AN TOÀN' : 'CẢNH BÁO'}
                </span>
              </div>
            </div>

            <div style={styles.videoContainer}>
              <img 
                src="http://localhost:5000/video_feed" 
                alt="RTSP Camera Stream" 
                style={styles.videoStream}
              />
            </div>

            <div style={styles.videoFooter}>
              <span>FPS: <strong>30</strong></span>
              <span>Độ đục: <strong style={{ color: '#34d399' }}>{waterData.turbidity} NTU</strong></span>
            </div>
          </div>

          {/* Các thẻ thông số nhỏ */}
          <div style={styles.metricsGrid}>
            <div style={styles.subCard}>
              <span style={styles.subLabel}>Giá trị RGB</span>
              <div style={styles.subValue}>R:{waterData.rgb.r} G:{waterData.rgb.g} B:{waterData.rgb.b}</div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${(waterData.rgb.r / 255) * 100}%` }}></div>
              </div>
            </div>
            <div style={styles.subCard}>
              <span style={styles.subLabel}>Độ sáng (L)</span>
              <div style={styles.subValue}>{waterData.brightness}%</div>
              <span style={styles.subDesc}>Mức chuẩn ổn định</span>
            </div>
            <div style={styles.subCard}>
              <span style={styles.subLabel}>Độ đục / Độ trong</span>
              <div style={{ ...styles.subValue, color: '#38bdf8' }}>{waterData.turbidity} NTU</div>
              <span style={{ ...styles.subDesc, color: '#34d399' }}>Nằm trong giới hạn</span>
            </div>
            <div style={styles.subCard}>
              <span style={styles.subLabel}>Chỉ số Bất Thường</span>
              <div style={{ ...styles.subValue, color: '#34d399' }}>0.05 (Thấp)</div>
              <span style={styles.subDesc}>Ngưỡng báo động: 0.65</span>
            </div>
          </div>

        </div>

        {/* Cột phải: Zalo Hub & Lịch sử */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Zalo Hub */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.zaloIcon}>Z</div>
                <div>
                  <h3 style={styles.cardTitle}>Zalo Notification Hub</h3>
                  <p style={{ fontSize: '10px', color: '#94a3b8' }}>Tích hợp Zalo ZNS / Webhook</p>
                </div>
              </div>
              <span style={styles.connectedBadge}>Đã kết nối</span>
            </div>

            <div style={styles.zaloBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⚠️ CẢNH BÁO MÔI TRƯỜNG</span>
                <span>Hôm nay, 14:19</span>
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                Phát hiện nước thải <strong style={{ color: '#f87171' }}>BẤT THƯỜNG</strong> tại Trạm #03. Độ đục: <strong style={{ color: '#38bdf8' }}>18.5 NTU</strong>. Đề nghị kiểm tra hệ thống!
              </p>
              <div style={styles.zaloFooter}>
                <span>Người nhận: <strong>Group Kỹ thuật</strong></span>
                <span style={{ color: '#34d399' }}>Đã gửi thành công ✓</span>
              </div>
            </div>

            <div style={styles.webhookInfo}>
              <div style={styles.webhookRow}><span>Trạng thái Webhook:</span><strong style={{ color: '#34d399' }}>Active (200 OK)</strong></div>
              <div style={styles.webhookRow}><span>Tin nhắn đã gửi hôm nay:</span><strong>3</strong></div>
              <div style={styles.webhookRow}><span>Thời gian phản hồi API:</span><strong style={{ color: '#38bdf8' }}>142 ms</strong></div>
            </div>

            <button style={styles.zaloBtn} onClick={handleTestZalo}>✈️ Cấu hình & Test Gửi Zalo ZNS</button>
          </div>

          {/* Lịch sử */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Lịch sử Quan trắc & Cảnh báo</h3>
              <span style={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>Xóa lịch sử</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {waterData.history.map((item, idx) => (
                <div key={idx} style={styles.historyItem}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{item.time}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {item.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', margin: 0 }}>RGB: {item.rgb}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Nguy cơ</span>
                    <strong style={{ fontSize: '12px', color: '#f1f5f9' }}>{item.risk}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0b0f19', color: '#f1f5f9', minHeight: '100vh', padding: '24px', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '16px 24px', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBox: { padding: '10px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '12px', color: '#22d3ee', fontSize: '18px' },
  title: { fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', margin: 0 },
  badgeIoT: { fontSize: '10px', fontWeight: 'bold', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(6, 182, 212, 0.3)' },
  subtitle: { fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  onlineBadge: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#34d399', fontWeight: '500' },
  dot: { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' },
  configBtn: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' },
  card: { backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 },
  badgeAI: { fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '8px', fontWeight: '600' },
  statusTag: { fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px', border: '1px solid' },
  videoContainer: { backgroundColor: '#030712', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '360px' },
  videoStream: { width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' },
  videoFooter: { display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #1e293b', fontSize: '12px', color: '#94a3b8' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' },
  subCard: { backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' },
  subLabel: { fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' },
  subValue: { fontSize: '15px', fontWeight: 'bold', color: '#f1f5f9' },
  subDesc: { fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' },
  progressBarBg: { width: '100%', backgroundColor: '#1e293b', height: '6px', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' },
  progressBarFill: { backgroundColor: '#22d3ee', height: '100%' },
  zaloIcon: { width: '28px', height: '28px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' },
  connectedBadge: { fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '8px', fontWeight: '600' },
  zaloBox: { backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', marginBottom: '14px' },
  zaloFooter: { marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' },
  webhookInfo: { backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', marginBottom: '14px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1' },
  webhookRow: { display: 'flex', justifyContent: 'space-between' },
  zaloBtn: { width: '100%', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', padding: '10px', borderRadius: '12px', border: 'none', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' },
  historyItem: { backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
};