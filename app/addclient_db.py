from flask import jsonify, session, request
from app import app
from db import get_db_copier_connection

# 輔助函數：根據使用者的 class 獲取表格名稱
def get_table_name(user_class):
    if user_class == "斗六區":
        userclass = "douliu"
    elif  user_class == "斗南區":
        userclass = "dounan"
    elif  user_class == "虎尾區":
        userclass = "huwei"
    elif  user_class == "西螺區":
        userclass = "xiluo"
    elif  user_class == "雲科大":
        userclass = "yunlin"
    return f'{userclass}'

# API端点：检查客户名称和机号是否存在
@app.route('/api/check_client_exists', methods=['GET'])
def check_client_exists():
    client_name = request.args.get('client_name')
    if not client_name:
        return jsonify({'error': '缺少必要的參數'}), 400
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400

    conn = get_db_copier_connection()
    cursor = conn.cursor()

    try:
        # 检查客户名称是否存在
        cursor.execute(f'SELECT `機號`, `IP位置` FROM `CLIENT_{table_name}` WHERE `客戶名稱` = %s', (client_name,))
        client_info = cursor.fetchone()

        if client_info:
            machine_number, ip_address = client_info
            client_exists = True
        else:
            machine_number = None
            ip_address = None
            client_exists = False

        return jsonify({
            'client_exists': client_exists,
            'machine_number': machine_number,
            'ip_address': ip_address
        })
    except Exception as e:
        print(f"Error checking client existence: {e}")
        return jsonify({'error': '伺服器錯誤'}), 500
    finally:
        cursor.close()
        conn.close()

# API端点：添加客户到数据库
@app.route('/api/add_client', methods=['POST'])
def add_client():
    data = request.json
    client_name = data.get('client_name')
    machine_number= data.get('machine_number') or None
    machine_model = data.get('machine_modal') or None
    ip_address = data.get('ip_address') or None
    if not client_name:
        return jsonify({'error': '缺少客戶名稱'}), 400
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f'INSERT INTO `CLIENT_{table_name}` (`客戶名稱`, `機號`, `機型`, `IP位置`) VALUES (%s, %s, %s, %s) ', (client_name, machine_number, machine_model, ip_address) )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': '客戶添加完成'}), 201