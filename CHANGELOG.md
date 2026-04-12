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
    - [Changed](#changed)
    - [Added](#added)
  - [\[1.0.2-alpha\] - 2026-04-12](#102-alpha---2026-04-12)
    - [Changed](#changed-1)
    - [Added](#added-1)
  - [\[1.0.1-alpha\] - 2026-04-12](#101-alpha---2026-04-12)
    - [Security](#security)
    - [Changed](#changed-2)
    - [Added](#added-2)
  - [\[1.0.0-alpha\] - 2026-04-09](#100-alpha---2026-04-09)
    - [Changed](#changed-3)
    - [Added](#added-3)

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

### Changed

- **Dự kiến dọn kiến trúc mã nguồn để tránh drift giữa nhiều bản contract:**
  - Cần xác định rõ file contract nào là nguồn chuẩn để compile, deploy và test.
  - Tránh tình trạng chỉnh sửa một nơi nhưng deploy hoặc kiểm thử trên một bản khác.

### Added

- **Bổ sung backlog mở rộng Reader contract phục vụ debug và vận hành:**
  - Có thể thêm các API truy vấn phục vụ kiểm tra role, recovery chain và trạng thái governance theo tenant.
  - Các API reader mở rộng sẽ hữu ích cho CLI, dashboard quản trị và kiểm thử tích hợp.

- **Bổ sung kế hoạch tăng độ phủ kiểm thử cho các rule phân tách quyền:**
  - Cần thêm test cho toàn bộ các trường hợp Protocol Admin không được trở thành tenant hoặc operator theo mọi đường đi trực tiếp và gián tiếp.
  - Bao gồm các case qua create tenant, update treasury, recovery delegate, recovery by admin, operator onboarding, ký tài liệu và co-sign.

- **Bổ sung khả năng truy vết giao dịch trong bộ công cụ test sandbox:**
  - Cho phép xem nhanh thông tin transaction lifecycle và event decode ngay từ CLI mà không cần mở explorer ngoài.

---

## [1.0.2-alpha] - 2026-04-12

### Changed

- **Cải thiện hiển thị dữ liệu trong sandbox CLI (tất cả hàm view):**
  - Thay thế toàn bộ `console.log(object)` thô bằng output có nhãn, định dạng rõ ràng.
  - Các giá trị ETH (stake, minStake, minOperatorStake) được hiển thị trực tiếp dưới dạng chuỗi `X.X ETH` — xử lý tại tầng SDK, CLI không cần import ethers.
  - Timestamp (createdAt, unstakeReadyAt) được format sang giờ địa phương vi-VN.
  - Boolean được hiển thị bằng ký hiệu ✅/❌ thay vì `true`/`false`.
  - Địa chỉ zero (`0x000...000`) trong recovery delegate được thay bằng `—`.
  - `unstakeCooldown` hiển thị cả giây lẫn số giờ quy đổi.
  - `violationPenalty` hiển thị cả BPS lẫn phần trăm.

- **Đồng bộ tầng SDK: chuyển các trường ETH từ `bigint` sang `string` đã định dạng:**
  - `OperatorStatus.stakeAmount` → `"X.X ETH"`
  - `CoSignStatus.minStake` → `"X.X ETH"`
  - `getCoSignPolicy()` return `minStake` → `"X.X ETH"`
  - `getTenantRuntimeConfig()` return `minOperatorStake` → `"X.X ETH"`

### Added

- **Bổ sung trường `operatorManager` vào thông tin Tenant:**
  - Thêm `address operatorManager` vào struct `VoucherTypes.Tenant` (lưu trữ on-chain).
  - `VoucherProtocol.createTenant` lưu `config.operatorManager` vào struct khi khởi tạo.
  - `VoucherProtocolReader.getTenantInfo` trả thêm `operatorManager` trong tuple output.
  - ABI, SDK `TenantInfo` interface và `getTenantInfo()` đều được cập nhật đồng bộ.
  - CLI sandbox hiển thị đầy đủ 3 địa chỉ governance: Admin, Op.Manager, Treasury.
  - **Lưu ý:** cần redeploy contract để áp dụng thay đổi struct.

## [1.0.1-alpha] - 2026-04-12

### Security

- **Hoàn thiện thêm lớp tách biệt quyền hạn cho Protocol Admin ở các đường đi gián tiếp:**
  - Đã bổ sung kiểm tra để chặn ví có `PROTOCOL_ADMIN_ROLE` tại các hàm:
    1. `setTreasury`
    2. `setRecoveryDelegate`
    3. `recoverOperatorByDelegate`
    4. `recoverOperatorByAdmin`
  - Qua đó khép kín hơn rule: Protocol Admin không được trở thành Tenant role hoặc Operator thông qua các luồng cập nhật treasury và recovery.

- **Làm rõ mô hình phân quyền cấp protocol:**
  - Đã thống nhất mô tả và triển khai hiện tại theo `PROTOCOL_ADMIN_ROLE`.
  - Đã đồng bộ lại tài liệu mô tả hàm để tránh hiểu nhầm giữa khái niệm `protocolOwner` và quyền vận hành thực tế của Protocol Admin.

### Changed

- **Đã đồng bộ lại tài liệu chức năng theo kiến trúc core mới (thin orchestrator + external libraries):**
  - Cập nhật phần mở đầu và danh sách hàm trong tài liệu để khớp với mô hình `VoucherProtocol` + `OperatorLib` + `DocumentLib` + `CoSignLib` + `RecoveryLib`.
  - Làm rõ mô hình governance hiện tại: `admin`, `operatorManager`, `treasury` (không còn slasher role tách riêng trong logic vận hành).

- **Đã cập nhật sandbox CLI để hỗ trợ debug giao dịch tốt hơn:**
  - Bổ sung menu read-only tra cứu lịch sử giao dịch theo transaction hash.
  - Kết quả trả về gồm transaction, receipt, block, confirmations và dữ liệu decode input/logs.

- **Đã đồng bộ input cho luồng cấu hình Co-Sign Policy trong CLI tenant manager:**
  - `minStake` được truyền đúng kiểu chuỗi ETH để SDK tự `parseEther`, tránh lệch kiểu dữ liệu khi gọi hàm.

- **Đã làm rõ semantics khi Tenant bị inactive theo hướng đóng băng lifecycle operator:**
  - Khi tenant inactive, các hàm sau sẽ `revert TenantInactive`:
    1. `topUpStake`
    2. `updateOperatorMetadata`
    3. `requestUnstake`
    4. `executeUnstake`
  - Semantics mới giúp trạng thái inactive nhất quán hơn giữa onboarding, ký tài liệu và vòng đời operator.

- **Đã chuẩn hóa hệ thống lỗi cho đầu vào địa chỉ operator:**
  - Bổ sung custom error `InvalidOperatorAddress`.
  - Cập nhật `setCoSignOperator` để dùng `InvalidOperatorAddress` khi `operator == address(0)` thay vì dùng `Unauthorized`.

- **Đã refactor các kiểm tra Protocol Admin trùng lặp trong Smart Contract:**
  - Tách các đoạn kiểm tra `PROTOCOL_ADMIN_ROLE` lặp lại thành helper nội bộ để giảm rủi ro bỏ sót rule khi mở rộng contract.

- **Đã tách khai báo lỗi và sự kiện sang interface dùng chung:**
  - Tạo contract interface riêng để chứa toàn bộ custom error và event của protocol.
  - `VoucherProtocol` kế thừa interface này để giảm lặp định nghĩa trong file chính và chuẩn hóa reuse cho các contract khác.
  - `VoucherProtocolReader` đã chuyển sang dùng lỗi `DocumentNotFound` từ interface chung.
  - Ghi nhận: thay đổi này chủ yếu giúp tổ chức mã nguồn; kích thước bytecode runtime gần như không giảm đáng kể.

- **Đã tách struct và utility helper sang file riêng:**
  - Tạo `VoucherTypes.sol` với library `VoucherTypes` để gom các struct dùng chung (`Tenant`, `Operator`, `Document`, `RegisterPayload`, `CoSignPayload`, `CoSignPolicy`, `DocumentSnapshot`, `TenantConfig`).
  - `VoucherProtocol` và `VoucherProtocolReader` đã chuyển toàn bộ kiểu dữ liệu struct sang `VoucherTypes.*`.
  - Tạo `VoucherProtocolHelper.sol` để chứa các hàm utility không thuộc logic nghiệp vụ chính (role hash, role mask, validation collision khi tạo tenant).
  - Ghi nhận: refactor giúp code rõ ràng hơn và dễ bảo trì; kích thước bytecode runtime của core contract vẫn chưa giảm dưới ngưỡng deploy mainnet.

- **Tách toàn bộ logic nghiệp vụ sang 4 external library để giảm bytecode thực sự:**
  - Tạo `OperatorLib.sol`: toàn bộ vòng đời operator (join, topUp, unstake, slash, softSlash, setStatus, setTreasury, setMinStake, setCooldown, setViolationPenalty).
  - Tạo `DocumentLib.sol`: `registerWithSignature`, `revokeDocument` (bao gồm EIP-712 recovery).
  - Tạo `CoSignLib.sol`: `coSignDocumentWithSignature`, `setCoSignPolicy`, `setCoSignOperator`.
  - Tạo `RecoveryLib.sol`: `setRecoveryDelegate`, `recoverOperatorByDelegate`, `recoverOperatorByAdmin`.
  - Gom toàn bộ state protocol vào `VoucherTypes.VoucherStorage` struct và truyền bằng storage reference vào các library.
  - `VoucherProtocol` trở thành thin orchestrator (~350 dòng): chỉ còn constructor, `createTenant`, `setTenantStatus`, view getters và các stub 1 dòng gọi sang library.
  - Xóa `VoucherProtocolViewAdapter.sol` (không cần thiết, tăng overhead dispatch).
  - Bật `viaIR: true` trong hardhat compiler để tối ưu thêm.
  - **Kết quả: bytecode giảm từ 25 055 → 9 688 bytes (−61%), tất cả contract đều dưới ngưỡng 24 576 bytes mainnet.**
  - Core logic không thay đổi: thứ tự kiểm tra, mutation state và event giữ nguyên hoàn toàn.
  - | Contract          | Size        | Status |
    | ----------------- | ----------- | ------ |
    | `VoucherProtocol` | 9,688 bytes | ✓      |
    | `OperatorLib`     | 5,851 bytes | ✓      |
    | `DocumentLib`     | 3,827 bytes | ✓      |
    | `CoSignLib`       | 3,964 bytes | ✓      |
    | `RecoveryLib`     | 4,685 bytes | ✓      |

- **Đã hardening Reader contract ở mức khởi tạo và phân trang:**
  - Bổ sung kiểm tra zero-address trong constructor của `VoucherProtocolReader`.
  - Chuyển tham chiếu `protocol` sang `immutable` để làm rõ intent và tối ưu hơn.
  - Chuẩn hóa hành vi pagination: `limit = 0` sẽ trả mảng rỗng ngay cho các hàm liệt kê.

- **Cập nhật tài liệu Smart Contract để khớp với logic hiện tại:**
  - Đã sửa mô tả các hàm liên quan đến `createTenant`, `joinAsOperator`, `registerWithSignature`, `coSignDocumentWithSignature`, `setCoSignOperator`, `setTreasury`, `setRecoveryDelegate`, `recoverOperatorByDelegate`, `recoverOperatorByAdmin`, `setTenantStatus`.
  - Đã đồng bộ signature mới của `createTenant` dùng `TenantConfig` và giải thích đúng theo cấu hình runtime hiện tại.

### Added

- **Đã siết chặt tách biệt role bên trong từng Tenant:**
  - Đã chuyển sang mô hình 3 ví cho governance tenant: `admin`, `operatorManager`, `treasury` (gộp quyền `slasher` vào `operatorManager`).
  - Đã chặn chồng chéo role ngay tại `createTenant` giữa `admin`, `operatorManager`, `treasury`.
  - Đã chặn cập nhật `treasury` sang ví đang giữ role governance của cùng tenant.
  - Đã override `grantRole` để enforce rule tách biệt role với các role động theo tenant, tránh lách qua AccessControl.
  - Đã cập nhật quyền cho `slashOperator` và `softSlashOperator` sang `operatorManager` để giảm số ví vận hành mà vẫn giữ tách biệt với `admin` và `treasury`.
  - Đã bổ sung custom error `TenantRoleConflict` để chuẩn hóa nguyên nhân revert.

- **Đã triển khai hướng 3 cho flow recovery operator (không kế thừa issuer cũ):**
  - Recovery hiện tiếp tục migrate stake, metadata, nonce và trạng thái active/inactive như trước.
  - Đã chốt semantics: recovery chỉ phục hồi năng lực vận hành cho ví mới, không tự động kế thừa quyền issuer lịch sử của ví cũ.
  - Đã bổ sung alias mapping để phục vụ audit/tra cứu chain recovery:
    1. Theo dõi hướng `oldOperator -> newOperator`.
    2. Theo dõi `rootOperator` của ví hiện tại trong chain recovery.
  - Đã bổ sung event và API reader để CLI/dashboard có thể truy vấn trạng thái alias recovery mà không thay đổi quyền nghiệp vụ tài liệu hiện hữu.

- **Bổ sung thêm hàm query lịch sử gia dịch bằng transaction hash:**
  - Transaction (Giao dịch): Bản đăng ký ban đầu của người dùng (gồm người gửi, người nhận, phí gas dự kiến và dữ liệu thô).
  - Receipt (Biên lai): Kết quả thực thi thực tế (xác nhận thành công hay thất bại, lượng gas thực tế đã tiêu tốn).
  - Block (Khối): "Địa chỉ" của giao dịch trong chuỗi (gồm số thứ tự khối, thời gian ghi nhận và mã định danh của khối đó).
  - Confirmations (Xác nhận): Độ tin cậy của giao dịch (số lượng khối mới đã đè lên trên; càng nhiều xác nhận càng khó bị đảo ngược).
  - Decoded Input (Đầu vào đã giải mã): Nội dung lệnh bạn đã gửi (dịch từ mã máy sang tên hàm và các tham số cụ thể mà bạn đã nhập).
  - Decoded Logs (Sự kiện đã giải mã): Thông báo phản hồi từ hợp đồng (ghi lại những thay đổi quan trọng đã xảy ra sau khi lệnh thực hiện xong).

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
