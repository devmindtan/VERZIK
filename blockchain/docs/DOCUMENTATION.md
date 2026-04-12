### GIAO THỨC EIP-712 (EIP-712 Domain)

**Tổng quan**

> EIP-712 là một tiêu chuẩn về hashing và ký dữ liệu có cấu trúc (typed structured data). Thay vì ký một chuỗi byte ngẫu nhiên, nó cho phép hiển thị dữ liệu dưới dạng JSON rõ ràng trên ví của người dùng.

---

**Tại sao nó lại được sinh ra?**

_EIP-712 giải quyết 2 vấn đề lớn:_

- Tính minh bạch (Readability): Giúp người dùng đọc được nội dung họ đang ký (ví dụ: "Tôi đang cho phép rút 100 Token A").
- Chống tấn công giả mạo (Phishing & Replay Attacks):
  - Cross-chain replay: Ngăn chặn việc lấy chữ ký ở mạng Testnet rồi đem đi thực thi ở Mainnet.
  - Cross-contract replay: Ngăn chặn việc lấy chữ ký của Contract A đem đi dùng cho Contract B.

---

**Chi tiết tham khảo**

- [eips.ethereum.org](https://eips.ethereum.org/EIPS/eip-712)

| **Basis Points (Bps)** | **Phần trăm (%)** | **Ví dụ thực tế**                      |
| ---------------------- | ----------------- | -------------------------------------- |
| **1**                  | **0.01%**         | Phạt cực nhẹ, mang tính cảnh cáo.      |
| **10**                 | **0.1%**          |                                        |
| **50**                 | **0.5%**          |                                        |
| **100**                | **1%**            | Mức phạt phổ biến cho lỗi nhẹ.         |
| **500**                | **5%**            |                                        |
| **1000**               | **10%**           | Phạt nặng (Soft Slash).                |
| **5000**               | **50%**           | Phạt mất nửa số tiền Stake.            |
| **10000**              | **100%**          | **Hard Slash** (Mất trắng tiền stake). |
