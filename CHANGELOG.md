# Changelog

Tất cả các thay đổi quan trọng đối với dự án này sẽ được ghi lại trong file này.
Dự án tuân thủ tiêu chuẩn [Semantic Versioning](https://semver.org/).

---

## 📑 Mục lục

- [Changelog](#changelog)
  - [📑 Mục lục](#-mục-lục)
  - [📌 Giải thích thuật ngữ (Quick Reference)](#-giải-thích-thuật-ngữ-quick-reference)
  - [📌 Giải thích các giai đoạn phiên bản (Suffix)](#-giải-thích-các-giai-đoạn-phiên-bản-suffix)
  - [\[Unreleased\]](#unreleased)
  - [\[1.0.0-alpha\] - 2026-04-09](#100-alpha---2026-04-09)
    - [Changed](#changed)
    - [Added](#added)

---

## 📌 Giải thích thuật ngữ (Quick Reference)

| Key            | Ý nghĩa     | Khi nào dùng?                                                         |
| :------------- | :---------- | :-------------------------------------------------------------------- |
| **Added**      | Thêm mới    | Khi triển khai một tính năng hoặc chức năng mới hoàn toàn.            |
| **Changed**    | Thay đổi    | Khi cập nhật, chỉnh sửa logic hoặc giao diện của tính năng hiện có.   |
| **Deprecated** | Sắp loại bỏ | Cảnh báo những tính năng vẫn còn hoạt động nhưng sẽ bị xóa ở bản sau. |
| **Removed**    | Loại bỏ     | Khi chính thức xóa bỏ một tính năng khỏi dự án.                       |
| **Fixed**      | Sửa lỗi     | Khi vá lỗi (bug), xử lý các vấn đề về vận hành.                       |
| **Security**   | Bảo mật     | Khi cập nhật các bản vá lỗ hổng hoặc nâng cấp cơ chế xác thực.        |

---

## 📌 Giải thích các giai đoạn phiên bản (Suffix)

| **Suffix**  | **Tên gọi** | **Trạng thái dự án**                                       | **Mục tiêu chính**                                  |
| ----------- | ----------- | ---------------------------------------------------------- | --------------------------------------------------- |
| **-alpha**  | Sơ khởi     | Chưa hoàn thiện, còn thiếu nhiều tính năng.                | Tập trung xây dựng cấu trúc (Database, UI/UX thô).  |
| **-beta**   | Thử nghiệm  | Đã có các tính năng chính nhưng còn nhiều lỗi (bugs).      | Tập trung kiểm thử (Testing) và vá lỗi.             |
| **-rc**     | Ứng viên    | Viết tắt của _Release Candidate_. Gần như hoàn thiện.      | Kiểm tra lần cuối trước khi chốt bản chính thức.    |
| **-stable** | Ổn định     | Bản hoàn chỉnh, hoạt động trơn tru, sẵn sàng nộp/đăng bài. | Duy trì và sẵn sàng cho các đợt chấm điểm/vận hành. |

## [Unreleased]

---

## [1.0.0-alpha] - 2026-04-09

### Changed

- **Cập nhật hàm createTenant:**
  - Thêm 2 tham số mới trong Smart Contract là minStake và unstakeCooldown cho hàm để tiết kiệm gas về sau cho việc điều chỉnh các tham số này
  - Tách tenantAdmin ra thành 3 tham số địa chỉ là admin, slasher và operatorManager để tách ví mặc định ra cho phép điều chỉnh role ngay ban đầu đỡ tốn gas chỉnh sửa sau này
  - Bổ sung các điều kiện kiểm tra đầu vào cho các tham số mới thêm
- **Cập nhật hàm softSlashOperator:**
  - Ngăn chặn việc tự phạt chính mình

### Added

- **Một owner protocol không được phép trở thành bất kì quyền nào khác để tránh xung đột và rò rỉ thông tin chỉ được phép quản trị ở cấp độ protocol:**
  - Không được đăng kí thành Operator
  - Không được kí tài liệu
  - Không được đồng kí
  - Không được cấu hình co-sign
  - Không được trở thành 1 Tenant
- **Bổ sung thêm CLI cho từng role để test các hàm trong SDK cũng như là Smart Contract:**
  - Owner (Protocol)
  - Tenant (Admin, Slasher, Manager)
  - Operator
- **Chỉnh sửa bổ sung thên 18 hàm vào sdk và tái cấu trúc:**
  - Nhóm Protocol & Tenant Admin:
    1. setTenantStatus: Thay đổi trạng thái hoạt động của Tenant.
    2. setTreasury: Cập nhật địa chỉ ví nhận phí (treasury).
  - Nhóm Slasher (Xử lý vi phạm):
    1.  slashOperator: Phạt nặng Operator (thường là mất tiền stake).
    2.  softSlashOperator: Phạt nhẹ dựa trên mã vi phạm.
  - Nhóm Quản lý Operator & Chính sách:
    1.  setOperatorStatus: Admin thay đổi trạng thái Operator.
    2.  recoverOperatorByAdmin: Khôi phục Operator thông qua Admin.
    3.  setCoSignPolicy: Thiết lập quy tắc ký chung (stake tối thiểu, số lượng người ký...).
    4.  setCoSignOperator: Cấp quyền/vai trò cho từng Operator cụ thể trong chính sách ký.
    5.  setMinOperatorStake: Cập nhật mức stake tối thiểu của Tenant.
    6.  setUnstakeCooldown: Thiết lập thời gian chờ khi rút stake.
    7.  setViolationPenalty: Quy định tỷ lệ phạt cho từng lỗi vi phạm.
  - Nhóm Tương tác nâng cao của Operator:
    1.  topUpStake: Nạp thêm tiền stake.
    2.  updateOperatorMetadata: Cập nhật thông tin (URI).
    3.  requestUnstake: Gửi yêu cầu rút stake.
    4.  executeUnstake: Thực hiện lệnh rút sau khi hết thời gian chờ.
    5.  coSignDocumentWithSignature: Thực hiện ký chung tài liệu.
    6.  setRecoveryDelegate: Ủy quyền cho ví khác để khôi phục tài khoản.
    7.  recoverOperatorByDelegate: Khôi phục thông qua người được ủy quyền.
