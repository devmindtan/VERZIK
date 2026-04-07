import psycopg2
from psycopg2 import sql

DATABASE_URL = "postgresql://vietfuture:vietfuture123@10.43.129.162:5432/vietfuture?options=-csearch_path%3Dvietfuture_schema"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # 1. Kiểm tra Schema hiện tại
    cur.execute("SHOW search_path;")
    schema = cur.fetchone()[0]
    print(f"✅ Kết nối thành công! Schema hiện tại: {schema}")
    print("-" * 50)

    # 2. Lấy danh sách tất cả các bảng trong schema này
    # Ta dùng vietfuture_schema vì search_path có thể chứa cả 'public'
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'vietfuture_schema';
    """)
    tables = cur.fetchall()

    if not tables:
        print("ℹ️ Schema này hiện chưa có bảng nào.")
    else:
        print(f"Total tables found: {len(tables)}")
        
        for table in tables:
            table_name = table[0]
            print(f"\n[ Bảng: {table_name} ]")
            
            # 3. Lấy nội dung của từng bảng
            # Sử dụng sql.Identifier để tránh SQL Injection và lỗi ký tự đặc biệt
            query = sql.SQL("SELECT * FROM {} LIMIT 10").format(sql.Identifier(table_name))
            cur.execute(query)
            
            # Lấy tên các cột để in cho đẹp
            colnames = [desc[0] for desc in cur.description]
            print(f"Cột: {' | '.join(colnames)}")
            
            rows = cur.fetchall()
            if not rows:
                print("   (Bảng trống)")
            else:
                for row in rows:
                    print(f"   {row}")
    
    print("-" * 50)
    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Lỗi kết nối hoặc truy vấn: {e}")