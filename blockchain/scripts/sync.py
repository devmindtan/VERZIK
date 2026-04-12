import os
import shutil

CONFIG = {
    "ABI": {
        "src": "../ignition/deployments/chain-31337/artifacts",
        "dst": "../../blockchain/abi",
        "files": ["VoucherProtocolModule#VoucherProtocol.json", "VoucherProtocolModule#VoucherProtocolReader.json", "VoucherProtocolModule#CoSignLib.json", "VoucherProtocolModule#DocumentLib.json", "VoucherProtocolModule#OperatorLib.json", "VoucherProtocolModule#RecoveryLib.json"]
    },
    "CONTRACTS": {
        "src": "../contracts",
        "dst": "../../blockchain/contracts",
        "files": ["VoucherProtocolReader.sol", "VoucherProtocol.sol", "CoSignLib.sol", "DocumentLib.sol", "IVoucherProtocolErrorsEvents.sol", "OperatorLib.sol", "RecoveryLib.sol", "VoucherProtocolHelper.sol", "VoucherTypes.sol"]
    },
    "DOCS": {
        "src": "../docs/report",
        "dst": "../../blockchain/docs",
        "files": ["FUNCTION_DESCRIPTION.md", "DOCUMENTATION.md"]
    },
    "DEPLOYED_ADDR": {
        "src": "../ignition/deployments/chain-31337",
        "dst": "../../blockchain/deployed-addresses",
        "files": ["deployed_addresses.json"]
    },
    "SCRIPTS": {
        "src": ".",
        "dst": "../../blockchain/scripts",
        "files": ["sync.py"]
    },
    "MODULES": {
        "src": "../ignition/modules",
        "dst": "../../blockchain/scripts",
        "files": ["VoucherProtocol.ts"]
    }
}

def list_summary():
    """Liệt kê trạng thái hiện tại của các file mục tiêu."""
    print(f"{'NHÓM':<15} | {'FILE':<50} | {'TRẠNG THÁI'}")
    print("-" * 80)
    
    for group, info in CONFIG.items():
        for file_name in info['files']:
            src_path = os.path.join(info['src'], file_name)
            exists = "✅ Sẵn sàng" if os.path.exists(src_path) else "❌ Thiếu file"
            print(f"{group:<15} | {file_name:<50} | {exists}")

def execute_sync():
    """Thực hiện copy các file đã cấu hình."""
    print("\n--- Bắt đầu quá trình đồng bộ ---")
    for group, info in CONFIG.items():
        src_dir = info['src']
        dst_dir = info['dst']
        
        if not os.path.exists(dst_dir):
            os.makedirs(dst_dir)
            print(f"📁 Đã tạo thư mục: {dst_dir}")

        for file_name in info['files']:
            src_file = os.path.join(src_dir, file_name)
            dst_file = os.path.join(dst_dir, file_name)

            if os.path.exists(src_file):
                try:
                    shutil.copy2(src_file, dst_file)
                    print(f"  [OK] {group} -> {file_name}")
                except Exception as e:
                    print(f"  [ERR] {file_name}: {e}")
            else:
                print(f"  [SKIP] {file_name} (Không tìm thấy nguồn)")

def main():
    list_summary()
    
    confirm = input("\nBạn có muốn đồng bộ các file trên sang thư mục Blockchain không? (y/n): ")
    if confirm.lower() == 'y':
        execute_sync()
        print("\n✨ Hoàn tất!")
    else:
        print("\n🚫 Đã hủy.")

if __name__ == "__main__":
    main()