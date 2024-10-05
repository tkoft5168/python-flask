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

# API端点：根据用户的 class 获取最后报表日期
@app.route('/api/get_last_report_date', methods=['GET'])
def get_last_report_date():
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f'SELECT MAX(`日期`) FROM `report_{table_name}`')
    last_report_date = cursor.fetchone()[0]  # 假设报表日期是 report_date 字段
    cursor.close()
    conn.close()
    if not last_report_date:
        return jsonify({'error': '找不到報表'}), 404
    
    # 返回最后日期的JSON响应
    return jsonify({'last_report_date': last_report_date})

# API端点：获取客户名称列表
@app.route('/api/get_client_names', methods=['GET'])
def get_client_names():
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f'SELECT `客戶名稱` FROM `client_{table_name}`')
    client_names = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify({'client_names': client_names})

#接收客户名称并返回对应的机器号、机型和 IP 地址。
@app.route('/api/get_client_info', methods=['GET'])
def get_client_info():
    client_name = request.args.get('client_name')
    if not client_name:
        return jsonify({'error': '找不到客戶'}), 400
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f'SELECT `機號`, `機型`, `IP位置` FROM `CLIENT_{table_name}` WHERE `客戶名稱` = %s', (client_name,))
    client_info = cursor.fetchone()
    cursor.close()
    conn.close()

    if not client_info:
        # 如果未找到客户信息，直接返回空响应
        return '', 204  # 204 表示成功但没有内容需要返回

    return jsonify({
        'machine_number': client_info[0],
        'machine_model': client_info[1],
        'ip_address': client_info[2]
    })
#处理提交的表单数据
@app.route('/api/add_daily_report', methods=['POST'])
def add_daily_report():
    data = request.json

    report_date = data.get('report_date')
    report_client_name = data.get('report_client_name')
    report_machine_number = data.get('report_machine_number') or None
    report_modal = data.get('report_modal') or None
    report_b_counter = data.get('report_b_counter') or None
    report_c_counter = data.get('report_c_counter') or None
    report_c_counter2 = data.get('report_c_counter2') or None
    report_part = data.get('report_part') or None
    report_part_counter = data.get('report_part_counter') or None
    report_service = data.get('report_service') or None

    if not report_date or not report_client_name:
        return jsonify({'error': '找不到輸入的資料'}), 400
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(
        f'INSERT INTO `report_{table_name}` (`日期`, `客戶名稱`, `機號`, `機型`, `黑白計數器`, `彩色計數器`, `彩色計數器2`, `更換零件料號`, `數量`, `維修情況`) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
        (report_date, report_client_name, report_machine_number, report_modal, report_b_counter, report_c_counter, report_c_counter2, report_part, report_part_counter, report_service)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'message': '報表添加完成'}), 201



# API端点：更新客户信息
@app.route('/api/update_client', methods=['POST'])
def update_client():
    data = request.json
    client_name = data.get('client_name')
    machine_number = data.get('machine_number')
    ip_address = data.get('ip_address')
    
    if not client_name:
        return jsonify({'error': '缺少客戶名稱'}), 400

    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()

    cursor.execute(f'SELECT `機號`, `IP位置` FROM `CLIENT_{table_name}` WHERE `客戶名稱` = %s', (client_name,))
    client_info = cursor.fetchone()

    if not client_info:
        cursor.close()
        conn.close()
        return jsonify({'error': '找不到客戶信息'}), 404

    db_machine_number, db_ip_address = client_info

    update_fields = []
    update_values = []
    
    if machine_number and (not db_machine_number or machine_number != db_machine_number):
        update_fields.append('`機號` = %s')
        update_values.append(machine_number)
    
    if ip_address and (not db_ip_address or ip_address != db_ip_address):
        update_fields.append('`IP位置` = %s')
        update_values.append(ip_address)
    
    if update_fields:
        update_values.append(client_name)
        update_sql = f'UPDATE `CLIENT_{table_name}` SET {", ".join(update_fields)} WHERE `客戶名稱` = %s'
        cursor.execute(update_sql, tuple(update_values))
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'message': '客户信息更新成功'}), 200

