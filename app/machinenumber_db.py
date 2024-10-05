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
    elif  user_class == "管理者":
        userclass = "管理者"
    return f'{userclass}'

#  API端点：修改客戶中取得客户信息
@app.route('/api/get_machinenumber_list', methods=['POST'])
def machinenumber_list():
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
            SELECT 
                `廠牌`,
                `機號`, 
                `機型`,  
                `類型`
            FROM machine
    """)
    machinenumber = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(machinenumber), 200

@app.route('/api/search_machine_numbers', methods=['POST'])
def search_machine_numbers():
    data = request.json
    query = data.get('query', '').lower()
    # 假設資料庫已有機號資料
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 廠牌, 機號, 機型, 類型 FROM machine WHERE LOWER(機號) LIKE %s", (f'%{query}%',))
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({'results': results})
@app.route('/api/edit_machinenumber', methods=['POST'])
def edit_machinenumber():
    data = request.json
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    try:

            cursor.execute(f"""
                    UPDATE machine
                    SET 廠牌 = %s, 機號 = %s, 機型 = %s, 類型 = %s
                    WHERE 機號 = %s
                """, (
                    data['newCustomer'],
                    data['machinenumber'],
                    data['newMachineNumberModel'],
                    data['newMachineNumberType'],
                    data['newMachineNumber']
                ))
            conn.commit()
             # 根據是否新增了機號返回相應的成功訊息
            return jsonify({'success': '機號資料更新成功'}), 200
    

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()
@app.route('/api/delete_machinenumber', methods=['POST'])
def delete_machinenumber():
    data = request.json
    machineNumber = data['machineNumber']

    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f""" DELETE FROM machine WHERE 機號 = %s """, (machineNumber,))
        conn.commit()
        return jsonify({'success': '機號刪除成功'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/get_brands', methods=['GET'])
def get_brands():
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    try:
        # 獲取所有不同的廠牌
        cursor.execute("SELECT DISTINCT 廠牌 FROM machine")
        brands = cursor.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    # 返回廠牌列表作為 JSON
    return jsonify({'brands': [brand[0] for brand in brands]}), 200


@app.route('/api/add_machine_number', methods=['POST'])
def add_machine_number():
    data = request.json
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    model = data.get('machine_number_model') 
    start_number = data.get('start_machine_number')
    end_number = data.get('end_machine_number', None)  # 如果沒有結束機號，則為 None
    customer = data.get('machine_number_customer')
    machine_type = data.get('machine_number_type')

    # 驗證輸入的機號是否為連續數字範圍
    try:
        start_machinenumber = int(start_number)
        if end_number:
            end_machinenumber = int(end_number)
            if end_machinenumber < start_machinenumber:
                return jsonify({'error': '結束機號不能小於起始機號'}), 400
        else:
            end_machinenumber = start_machinenumber
    except ValueError:
        return jsonify({'error': '機號必須為有效的數字'}), 400


    conn = get_db_copier_connection()
    cursor = conn.cursor() 
    start_machine_number = model + '-' + str(start_machinenumber).zfill(3)
    end_machine_number = model + '-' + str(end_machinenumber).zfill(3)
    try:
        # 查詢資料庫中已有的機號
        cursor.execute("""
            SELECT 機號 FROM machine WHERE 機號 BETWEEN %s AND %s
        """, (start_machine_number, end_machine_number))
        existing_machines = {row[0] for row in cursor.fetchall()}

        inserted_machines = []
        skipped_machines = []

        # 假設已取得的現有機號列表為 existing_machines
        existing_machines = set(existing_machines)  # 將其轉換為集合以加快查詢速度

        # 插入範圍內的所有機號，跳過重複的
        for machine_number in range(int(start_machinenumber), int(end_machinenumber) + 1):
            # 構造新的機號（補足三位數）
            newmachinenumber = model + '-' + str(machine_number).zfill(3)
            
            # 如果機號已經存在，則跳過
            if newmachinenumber in existing_machines:
                skipped_machines.append(newmachinenumber)
                continue
            
            # 插入新的機號
            cursor.execute("""
                INSERT INTO machine (機號, 廠牌, 機型, 類型)
                VALUES (%s, %s, %s, %s)
            """, (newmachinenumber, customer, model, machine_type))
            
            # 將成功插入的機號記錄下來
            inserted_machines.append(newmachinenumber)

        # 提交變更
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({
        'success': '機號新增完成',
        'inserted_machines': inserted_machines,
        'skipped_machines': skipped_machines
    }), 200
