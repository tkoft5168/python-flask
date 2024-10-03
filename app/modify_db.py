from flask import jsonify, render_template, session, request
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

#  API端点：修改客戶中取得客户信息
@app.route('/api/get_customer_list', methods=['POST'])
def customer_list():
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
            SELECT DISTINCT 
                client_{table_name}.ID, 
                client_{table_name}.客戶名稱, 
                client_{table_name}.機號, 
                client_{table_name}.機型, 
                machine.廠牌, 
                machine.類型,
                client_{table_name}.ip位置
            FROM client_{table_name}
            LEFT JOIN machine 
                ON client_{table_name}.機號 = machine.機號 
                OR (client_{table_name}.機號 IS NULL AND client_{table_name}.機型 = machine.機型)
            ORDER BY client_{table_name}.ID;
    """)
    client_names = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(client_names), 200
@app.route('/api/edit_customer', methods=['POST'])
def edit_customer():
    data = request.json
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()

    try:
                # 更新客戶資料
                    # Check if the new customer name already exists
            cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM client_{table_name} 
                    WHERE 客戶名稱 = %s AND ID != %s
                """, (data['new_customer_name'], data['id']))
                
            if cursor.fetchone()[0] > 0:
                    return jsonify({'error': '客戶名稱已存在'}), 400
            cursor.execute(f"""
                    UPDATE client_{table_name}
                    SET 客戶名稱 = %s, 機號 = %s, 機型 = %s, IP位置 = %s
                    WHERE ID = %s
                """, (
                    data['new_customer_name'],
                    data['new_machine_number'],
                    data['new_Customer_Model'],
                    data['new_Customer_Ip'],
                    data['id']
                ))
            conn.commit()
             # 根據是否新增了機號返回相應的成功訊息
            return jsonify({'success': '客戶資料更新成功'}), 200
    

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()
@app.route('/api/delete_customer', methods=['POST'])
def delete_customer():
    data = request.json
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            DELETE FROM client_{table_name}
            WHERE ID = %s
        """, (data['id'],))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'success': '客戶資料刪除成功'}), 200
@app.route('/api/search_customers', methods=['POST'])
def search_customers():
    data = request.json
    query = data.get('query', '')
    
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            SELECT DISTINCT 
                client_{table_name}.ID, 
                client_{table_name}.客戶名稱, 
                client_{table_name}.機號, 
                client_{table_name}.機型, 
                machine.廠牌, 
                machine.類型,
                client_{table_name}.ip位置
            FROM client_{table_name}
            LEFT JOIN machine 
                ON client_{table_name}.機號 = machine.機號 
                OR (client_{table_name}.機號 IS NULL AND client_{table_name}.機型 = machine.機型)
            WHERE client_{table_name}.客戶名稱 LIKE %s
            ORDER BY client_{table_name}.ID;
        """, (f"%{query}%",))
        customers = cursor.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    
    return jsonify(customers), 200

@app.route('/report_page')
def get_customer_reports():
     # 从请求参数中获取 customer_name
    customer_name = request.args.get('customer_name')
    if not customer_name:
        return "未指定客戶名稱", 400
    
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            SELECT `日期`, `客戶名稱`, `機號`, `機型`, `黑白計數器`, `彩色計數器`, `彩色計數器2`, `更換零件料號`, `數量`, `維修情況` 
            FROM report_{table_name}
            WHERE 客戶名稱 = %s
            ORDER BY report_{table_name}.`日期` DESC;
        """, (customer_name,))
        reports = cursor.fetchall()
       
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    # 渲染日報表页面，并传递数据
    return render_template('display_report.html', customer_name=customer_name, reports=reports)

#全區修改客戶功能
#  API端点：修改客戶中取得客户信息
@app.route('/api/get_allcustomer_list', methods=['POST'])
def allcustomer_list():
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
                        SELECT                           
                            CASE
                                WHEN `客戶名稱` IN (SELECT `客戶名稱` FROM `client_yunlin`) THEN '雲科大'
                                WHEN `客戶名稱` IN (SELECT `客戶名稱` FROM `client_douliu`) THEN '斗六區'
                                WHEN `客戶名稱` IN (SELECT `客戶名稱` FROM `client_xiluo`) THEN '西螺區'
                                WHEN `客戶名稱` IN (SELECT `客戶名稱` FROM `client_dounan`) THEN '斗南區'
                                WHEN `客戶名稱` IN (SELECT `客戶名稱` FROM `client_huwei`) THEN '虎尾區'
                                ELSE '未知'
                            END AS `客戶所在區`,
                            c.`客戶名稱`,
                            c.`機號`,
                            c.`機型`,
                            m.`廠牌`,
                            m.`類型`,
                            c.`ip位置`,
                            c.`id`
                        FROM (
                            SELECT `客戶名稱`, `機號`, `機型`, `ip位置` ,`id` FROM `client_yunlin`
                            UNION ALL
                            SELECT `客戶名稱`, `機號`, `機型`, `ip位置`,`id` FROM `client_douliu`
                            UNION ALL
                            SELECT  `客戶名稱`, `機號`, `機型`, `ip位置`,`id` FROM `client_xiluo`
                            UNION ALL
                            SELECT `客戶名稱`, `機號`, `機型`, `ip位置`,`id` FROM `client_dounan`
                            UNION ALL
                            SELECT `客戶名稱`, `機號`, `機型`, `ip位置`,`id` FROM `client_huwei`
                        ) AS c
                        LEFT JOIN `machine` AS m ON c.`機號` = m.`機號` OR (c.`機號` IS NULL AND c.`機型` = m.`機型`)
                        GROUP BY c.`客戶名稱`, c.`機號`, c.`機型`, c.`ip位置`, `id`, m.`廠牌`, m.`類型`
                        ORDER BY `客戶所在區`, c.`客戶名稱`, `機號`;

            """)
    allclient_names = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({
    'allclient_names': allclient_names,
    'user_class': user_class
    }), 200
@app.route('/api/edit_allcustomer', methods=['POST'])
def edit_allcustomer():
    data = request.json
    user_class = data['area']
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    
    try:
 
                # 更新客戶資料
                    # Check if the new customer name already exists
            cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM client_{table_name} 
                    WHERE 客戶名稱 = %s AND ID != %s
                """, (data['new_customer_name'], data['id']))
                
            if cursor.fetchone()[0] > 0:
                    return jsonify({'error': '客戶名稱已存在'}), 400
            cursor.execute(f"""
                    UPDATE client_{table_name}
                    SET 客戶名稱 = %s, 機號 = %s, 機型 = %s, IP位置 = %s
                    WHERE ID = %s
                """, (
                    data['new_customer_name'],
                    data['new_machine_number'],
                    data['new_Customer_Model'],
                    data['new_Customer_Ip'],
                    data['id']
                ))
            conn.commit()

            return jsonify({'success': '客戶資料更新成功'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()
@app.route('/api/delete_allcustomer', methods=['POST'])
def delete_allcustomer():
    data = request.json
    user_class = data['area']
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            DELETE FROM client_{table_name}
            WHERE ID = %s
        """, (data['id'],))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'success': '客戶資料刪除成功'}), 200


@app.route('/allreport_page')
def get_allcustomer_reports():

     # 从请求参数中获取 customer_name
    customer_name = request.args.get('customer_name')
    if not customer_name:
        return "未指定客戶名稱", 400

    user_class = request.args.get('area')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            SELECT `日期`, `客戶名稱`, `機號`, `機型`, `黑白計數器`, `彩色計數器`, `彩色計數器2`, `更換零件料號`, `數量`, `維修情況` 
            FROM report_{table_name}
            WHERE 客戶名稱 = %s
            ORDER BY report_{table_name}.`日期` DESC;
        """, (customer_name,))
        reports = cursor.fetchall()
       
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    # 渲染日報表页面，并传递数据
    return render_template('display_report.html', customer_name=customer_name, reports=reports)

