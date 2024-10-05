from flask import jsonify, render_template, session, request
from app import app
from db import get_db_copier_connection
from datetime import datetime


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


@app.route('/query_report', methods=['POST'])
def query_report():
    # 获取查询条件
    start_date = request.form.get('startDate')
    end_date = request.form.get('endDate')
    customer_name = request.form.get('customerName')
    model = request.form.get('model')
    part_number = request.form.get('partNumber')
    repair_content = request.form.get('repairContent')
    print(customer_name)
    # 获取用户类别
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    
    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400

    # 构建SQL查询
    query = f"""
        SELECT report_{table_name}.`日期`, report_{table_name}.`客戶名稱`, report_{table_name}.`機號`, report_{table_name}.`機型`, 
               report_{table_name}.`黑白計數器`, report_{table_name}.`彩色計數器`, report_{table_name}.`彩色計數器2`,
               report_{table_name}.`更換零件料號`, report_{table_name}.`數量`, report_{table_name}.`維修情況`, report_{table_name}.`ID`
        FROM report_{table_name}
        WHERE 1=1
    """

    # 根据条件添加到查询中
    params = []
    if start_date:
        query += f" AND report_{table_name}.`日期` >= %s"
        params.append(start_date)
    if end_date:
        query += f" AND report_{table_name}.`日期` <= %s"
        params.append(end_date)
    if customer_name:
        query += f" AND report_{table_name}.`客戶名稱` = %s"
        params.append(customer_name)
    if model:
        query += f" AND report_{table_name}.`機型` LIKE %s"
        params.append(f"%{model}%")
    if part_number:
        query += f" AND report_{table_name}.`更換零件料號` LIKE %s"
        params.append(f"%{part_number}%")
    if repair_content:
        query += f" AND report_{table_name}.`維修情況` LIKE %s"
        params.append(f"%{repair_content}%")

    # 执行数据库查询
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(query, tuple(params))
    reports = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template('query_report.html',  reports=reports, user_class=user_class, show_results=True)


@app.route('/reportsearch_customers')
def reportsearch_customers():
    keyword = request.args.get('keyword', '')
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    
    table_name = get_table_name(user_class)
    conn = get_db_copier_connection()
    cursor = conn.cursor()

    cursor.execute(f"""
                SELECT DISTINCT `客戶名稱`
                FROM report_{table_name}
                WHERE `客戶名稱` LIKE %s
                LIMIT 10
            """, (f'%{keyword}%',))
    
    customers = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    
    return jsonify({'customers': customers})


@app.route('/get_report_by_id/<int:report_id>', methods=['GET'])
def get_report_by_id(report_id):
    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400

    query = f"SELECT `ID`, `客戶名稱`, `機號`, `機型`, `黑白計數器`, `彩色計數器`, `彩色計數器2`, `更換零件料號`, `數量`, `維修情況`  FROM report_{table_name} WHERE `ID` = %s"

    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(query, (report_id,))
    report = cursor.fetchone()
    cursor.close()
    conn.close()

    if not report:
        return jsonify({'error': '報表未找到'}), 404



    report_data = {
        'ID': report[0],
        '客戶名稱': report[1],
        '機號': report[2],
        '機型': report[3],
        '黑白計數器': report[4],
        '彩色計數器': report[5],
        '彩色計數器2': report[6],
        '更換零件料號': report[7],
        '數量': report[8],
        '維修情況': report[9],
 
    }

    return jsonify(report_data)

@app.route('/edit_report', methods=['POST'])
def edit_report():
    report_id = request.json.get('report_id')
    customer_name = request.json.get('customer_name') or None
    machine_number = request.json.get('machine_number') or None
    machine_model = request.json.get('machine_model') or None
    bw_counter = request.json.get('bw_counter') or None
    color_counter = request.json.get('color_counter') or None
    color_counter2 = request.json.get('color_counter2') or None
    part_number = request.json.get('part_number') or None
    quantity = request.json.get('quantity') or None
    repair_content = request.json.get('repair_content') or None

    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400

    query = f"""
        UPDATE report_{table_name}
        SET  `客戶名稱` = %s, `機號` = %s, `機型` = %s, `黑白計數器` = %s, `彩色計數器` = %s, `彩色計數器2` = %s,
            `更換零件料號` = %s, `數量` = %s, `維修情況` = %s
        WHERE `ID` = %s
    """

    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(query, ( customer_name, machine_number, machine_model, bw_counter, color_counter,
                           color_counter2, part_number, quantity, repair_content, report_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'success': '報表更新成功'})

@app.route('/delete_report', methods=['POST'])
def delete_report():
    report_id = request.json.get('report_id')

    user_class = session.get('class')
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400

    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400

    query = f"DELETE FROM report_{table_name} WHERE `ID` = %s"

    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(query, (report_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'success': '報表刪除成功'})


# API端点：获取客户名称列表
@app.route('/api/get_area_client_names', methods=['POST'])
def get_area_client_names():
    user_class = request.json.get('queryAreaType')
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

@app.route('/query_area_report', methods=['POST'])
def query_area_report():
    # 获取查询条件
    start_date = request.form.get('startDate')
    end_date = request.form.get('endDate')
    customer_name = request.form.get('customerName')
    queryareatype = request.form.get('queryAreaType')
    model = request.form.get('model')
    part_number = request.form.get('partNumber')
    repair_content = request.form.get('repairContent')
    # 获取用户类别
    user_class = queryareatype
    if not user_class:
        return render_template('admin_reportquery.html', error=True)
    
    table_name = get_table_name(user_class)
    if not table_name:
       return render_template('admin_reportquery.html', error=True)

    # 构建SQL查询
    query = f"""
        SELECT report_{table_name}.`日期`, report_{table_name}.`客戶名稱`, report_{table_name}.`機號`, report_{table_name}.`機型`, 
               report_{table_name}.`黑白計數器`, report_{table_name}.`彩色計數器`, report_{table_name}.`彩色計數器2`,
               report_{table_name}.`更換零件料號`, report_{table_name}.`數量`, report_{table_name}.`維修情況`, report_{table_name}.`ID`
        FROM report_{table_name}
        WHERE 1=1
    """

    # 根据条件添加到查询中
    params = []
    if start_date:
        query += f" AND report_{table_name}.`日期` >= %s"
        params.append(start_date)
    if end_date:
        query += f" AND report_{table_name}.`日期` <= %s"
        params.append(end_date)
    if customer_name:
        query += f" AND report_{table_name}.`客戶名稱` = %s"
        params.append(customer_name)
    if model:
        query += f" AND report_{table_name}.`機型` LIKE %s"
        params.append(f"%{model}%")
    if part_number:
        query += f" AND report_{table_name}.`更換零件料號` LIKE %s"
        params.append(f"%{part_number}%")
    if repair_content:
        query += f" AND report_{table_name}.`維修情況` LIKE %s"
        params.append(f"%{repair_content}%")

    # 执行数据库查询
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(query, tuple(params))
    reports = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template('admin_reportquery.html',  reports=reports, user_class=user_class, show_results=True)