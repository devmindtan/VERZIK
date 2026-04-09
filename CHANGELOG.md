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
    - [Security](#security)
    - [Changed](#changed)
    - [Added](#added)
  - [\[1.0.0-alpha\] - 2026-04-09](#100-alpha---2026-04-09)
    - [Changed](#changed-1)
    - [Added](#added-1)

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

### Security

- **Tiếp tục siết chặt nguyên tắc tách biệt quyền hạn cho Protocol Owner / Protocol Admin:**
  - Dự kiến bổ sung kiểm tra đồng nhất tại các hàm còn có thể tạo đường vòng để Protocol Admin mang vai trò Tenant hoặc Operator.
  - Các điểm cần ưu tiên rà soát thêm:
    1. `setTreasury` để ngăn treasury bị đổi sang ví có `PROTOCOL_ADMIN_ROLE`.
    2. `setRecoveryDelegate` để ngăn delegate recovery là ví có `PROTOCOL_ADMIN_ROLE`.
    3. `recoverOperatorByDelegate` để ngăn Protocol Admin trở thành operator thông qua recovery.
    4. `recoverOperatorByAdmin` để ngăn `newOperator` là ví có `PROTOCOL_ADMIN_ROLE`.

- **Làm rõ mô hình phân quyền cấp protocol:**
  - Cần thống nhất rõ toàn bộ hệ thống sẽ cấm theo `protocolOwner` hay theo `PROTOCOL_ADMIN_ROLE`.
  - Hiện tại logic đang chạy theo role, nên cần đồng bộ lại tài liệu, SDK, CLI và test để tránh hiểu nhầm giữa khái niệm owner và protocol admin.

### Changed

- **Dự kiến refactor các kiểm tra Protocol Admin trùng lặp trong Smart Contract:**
  - Tách các đoạn `hasRole(PROTOCOL_ADMIN_ROLE, ...)` lặp lại thành helper nội bộ để giảm rủi ro bỏ sót rule khi mở rộng contract.

- **Dự kiến làm rõ semantics khi Tenant bị inactive:**
  - Cần xác định rõ tenant inactive sẽ:
    1. Chỉ chặn các hành động mới như join, register, co-sign.
    2. Hay đóng băng toàn bộ lifecycle operator, bao gồm top-up stake, update metadata, request unstake, execute unstake.
  - Sau khi chốt rule sẽ cập nhật đồng bộ trong contract, SDK, CLI và tài liệu.

- **Dự kiến chuẩn hóa hệ thống lỗi theo đúng ngữ nghĩa nghiệp vụ:**
  - Một số chỗ đang dùng lỗi chung như `Unauthorized` cho các trường hợp dữ liệu đầu vào không hợp lệ.
  - Sẽ xem xét tách thêm các custom error mang nghĩa rõ hơn như lỗi địa chỉ operator không hợp lệ hoặc lỗi cấu hình không hợp lệ.

- **Dự kiến dọn kiến trúc mã nguồn để tránh drift giữa nhiều bản contract:**
  - Cần xác định rõ file contract nào là nguồn chuẩn để compile, deploy và test.
  - Tránh tình trạng chỉnh sửa một nơi nhưng deploy hoặc kiểm thử trên một bản khác.

### Added

- **Bổ sung backlog hoàn thiện flow recovery operator:**
  - Logic recovery hiện mới chuyển stake, metadata, nonce và trạng thái active/inactive.
  - Cần xem xét bổ sung cơ chế kế thừa quyền nghiệp vụ của operator cũ, đặc biệt với các tài liệu mà ví cũ là issuer.
  - Các hướng mở rộng có thể bao gồm:
    1. Mapping alias từ ví cũ sang ví mới.
    2. Cho phép kiểm tra recovered operator trong các hàm nghiệp vụ liên quan đến issuer.
    3. Hoặc định nghĩa rõ recovery chỉ phục hồi quyền staking/ký mới chứ không kế thừa toàn bộ quyền issuer cũ.

- **Bổ sung backlog siết chặt tách biệt role bên trong từng Tenant:**
  - Cần cân nhắc chặn hoặc kiểm soát các trường hợp một ví đồng thời giữ nhiều vai trò như:
    1. `admin` đồng thời là `slasher`.
    2. `admin` đồng thời là `operatorManager`.
    3. `slasher` đồng thời là `operatorManager`.
    4. `treasury` đồng thời là một role quản trị của tenant.
  - Việc này giúp giảm xung đột lợi ích và làm governance rõ ràng hơn.

- **Bổ sung backlog mở rộng Reader contract phục vụ debug và vận hành:**
  - Có thể thêm các API truy vấn phục vụ kiểm tra role, recovery chain và trạng thái governance theo tenant.
  - Các API reader mở rộng sẽ hữu ích cho CLI, dashboard quản trị và kiểm thử tích hợp.

- **Bổ sung backlog chuẩn hóa hành vi pagination của Reader:**
  - Cần mô tả rõ hành vi khi `offset` vượt quá tổng số phần tử hoặc khi `limit = 0`.
  - Sau khi thống nhất sẽ cập nhật docs và test case tương ứng.

- **Bổ sung backlog hardening cho Reader contract:**
  - Có thể nâng cấp constructor của `VoucherProtocolReader` để kiểm tra địa chỉ protocol hợp lệ.
  - Có thể chuyển biến tham chiếu `protocol` sang `immutable` để rõ intent và tối ưu hơn.

- **Bổ sung kế hoạch tăng độ phủ kiểm thử cho các rule phân tách quyền:**
  - Cần thêm test cho toàn bộ các trường hợp Protocol Admin không được trở thành tenant hoặc operator theo mọi đường đi trực tiếp và gián tiếp.
  - Bao gồm các case qua create tenant, update treasury, recovery delegate, recovery by admin, operator onboarding, ký tài liệu và co-sign.

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
  - Không được trở thành 1 Tenant (Admin, Manager, Slasher, Treasury)
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
