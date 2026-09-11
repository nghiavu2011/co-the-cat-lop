// Phông chữ được đóng gói cục bộ (self-hosted qua @fontsource) thay vì tải từ
// Google Fonts CDN. Lý do: nhiều mạng công sở/trường học và trình chặn quảng
// cáo tại Việt Nam chặn fonts.googleapis.com — khi đó trình duyệt phải dùng
// phông dự phòng của hệ điều hành, và một số phông dự phòng (đặc biệt phông
// đơn cách monospace) không có đủ bộ dấu tiếng Việt, khiến chữ có dấu bị vỡ
// (ví dụ "cơ thể" hiển thị sai thành các ký tự tổ hợp lỗi). Tự đóng gói phông
// giúp trang hoạt động đúng bất kể tình trạng mạng.
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/500-italic.css';
import '@fontsource/be-vietnam-pro/300.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
