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



@app.route('/report_counter', methods=['POST'])
def report_counter():
    # 获取查询条件
    start_date = request.form.get('startDate')
    end_date = request.form.get('endDate')
    customer_name = request.form.get('customerName')
    # 获取用户类别
    user_class = session.get('class')
    # 检查客户名称是否为空
    if not customer_name:
        return jsonify({'error': '客户名稱不能為空'}), 400
    
    if not user_class:
        return jsonify({'error': '找不到使用者類別'}), 400
    
    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400
    # 构建SQL查询
    query = f"""
                       SELECT 
                            `ID`,
                            `日期`, 
                            `客戶名稱`, 
                            `機號`, 
                            `機型`, 
                            `黑白計數器`, 
                            `彩色計數器`, 
                            `彩色計數器2`, 
                            `維修情況`
                        FROM (
                            SELECT 
                                `ID`,
                                `日期`, 
                                `客戶名稱`, 
                                `機號`, 
                                `機型`, 
                                `黑白計數器`, 
                                `彩色計數器`, 
                                `彩色計數器2`, 
                                `維修情況`,
                                ROW_NUMBER() OVER (PARTITION BY `日期`, `黑白計數器`, `彩色計數器`, `彩色計數器2` ORDER BY `ID`) AS rn
                            FROM report_{table_name}
                            WHERE `日期` BETWEEN %s AND %s AND `客戶名稱` = %s 
                           AND NOT ((`黑白計數器` = 0 OR `黑白計數器` IS NULL) AND (`彩色計數器` = 0 OR `彩色計數器` IS NULL))
                        ) AS sub
                        WHERE rn = 1 
                        ORDER BY `ID`


                """
    # 执行数据库查询
    conn = get_db_copier_connection()
    cursor = conn.cursor()
    cursor.execute(query, (start_date, end_date, customer_name))
    reports = cursor.fetchall()
    cursor.close()
    conn.close()

        # 如果没有找到数据，返回错误消息
    if not reports:
        return jsonify({'error':  '未找到相符的資料，請確認日期或客戶名稱是否正確'}), 400
    
    new_reports = []
    for row in reports:
        row = list(row)  # 将元组转换为列表
        for key in [5, 6, 7]:
            if row[key] is None:
                row[key] = 0
        new_reports.append(row)  # 将修改后的列表添加到新的列表中
    last_row = None
    bw_count = 0
    color_count = 0
        
  
            # 遍历数据并计算差异
    for row in new_reports:
             # 处理 None 的情况
            row_維修情況 = row[8] if row[8] is not None else ""


            if last_row is not None  and last_row[4] == row[4] and "換機" not in row_維修情況 and "計數器變更" not in row_維修情況:
                # 机号相同且維修情況不包含換機或計數器變更，计算差异并更新记录
                bw_diff = row[5] - last_row[5]
                color_diff = (row[6] +  row[7]) - (last_row[6] +  last_row[7])
                row.append( bw_diff)
                row.append(color_diff)
                bw_count += bw_diff
                color_count += color_diff
            else:
                # 机号不同或維修情況包含換機或計數器變更，重置计数器
                bw_count = row[5]
                color_count = row[6]
                row.append(0)
                row.append(0)

            # 更新记录
            last_row = row

        # 初始化记录和计数器
    total_bw_count = 0
    total_color_count = 0

        # 将数据添加到模型中
    for row in new_reports:
            total_bw_count += row[9]
            total_color_count += row[10]

                   # 将日期转换为字符串
        # 获取日期对象的字符串表示
    start_date = new_reports[0][1]
    end_date = new_reports[-1][1]
       # 判断是否同年同月
    if start_date.year == end_date.year and start_date.month == end_date.month:
            if start_date.day != end_date.day:
                        month_difference = 1  # 同年同月但不同日，设为 1
            else:
                        month_difference = 0  # 同年同月同日，设为 0
    else:
                    month_difference = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month
        # 计算月份差
    if month_difference > 0:
             # 计算平均值并四舍五入
            average_bw_count = round(total_bw_count / month_difference)
            average_color_count = round(total_color_count / month_difference)

                

    else:
            average_bw_count = 0
            average_color_count = 0


    # 将查询结果渲染到前端

    return jsonify({
        'reports': new_reports,
        'bcounter': total_bw_count,
        'ccounter': total_color_count,
        'bavgcounter': average_bw_count,
        'cavgcounter': average_color_count
    })


 # 管理者頁面張數查詢
@app.route('/area_report_counter', methods=['POST'])
def area_report_counter():
    # 获取查询条件
    start_date = request.form.get('startDate')
    end_date = request.form.get('endDate')
    customer_name = request.form.get('customerName')
    area_type = request.form.get('queryAreaCounterType')

    # 获取用户类别
    user_class = area_type
    # 检查客户名称是否为空
    
    if not user_class:
        return jsonify({'error': '請選擇區域'}), 400
    
    table_name = get_table_name(user_class)
    if not table_name:
        return jsonify({'error': '無效的使用者類別'}), 400
    # 构建SQL查询
    if not customer_name:
        all_client_data = []
        conn = get_db_copier_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT 客戶名稱 FROM client_{table_name}")
        clients = cursor.fetchall()
        cursor.close()

        for client in clients:
            customer_name = client['客戶名稱']
            client_data = fetch_and_process_client_data(start_date, end_date, customer_name, table_name)
            all_client_data.append((customer_name, client_data))
        areacounter_model=[]
        for client_name, data in all_client_data:
                total_bw_count = sum(row["黑白張數"] for row in data)
                total_color_count = sum(row["彩色張數"] for row in data)
                if data:
                    # 将 datetime.date 转换为字符串
                    start_date_str = data[0]["日期"]
                    end_date_str = data[-1]["日期"]
                    # 然后使用 QDate.fromString 转换回 QDate
                    start_date = start_date_str
                    end_date = end_date_str
                    
                    # 判断是否同年同月
                    if start_date.year == end_date.year and start_date.month == end_date.month:
                        if start_date.day != end_date.day:
                            month_difference = 1  # 同年同月但不同日，设为 1
                        else:
                            month_difference = 0  # 同年同月同日，设为 0
                    else:
                        month_difference = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month
                    
                    
                    average_bw_count = round(total_bw_count / month_difference) if month_difference > 0 else 0
                    average_color_count = round(total_color_count / month_difference) if month_difference > 0 else 0
                        
                        # 格式化统计月份为 "MM-yyyy 至 MM-yyyy"
                    start_month = start_date_str
                    end_month = end_date_str
                    month_range = f"{start_month} - {end_month}"
                    month_count = f"{month_difference}個月"
                else:
                    average_bw_count = 0
                    average_color_count = 0
                    month_range = "N/A"  # 如果没有数据，显示为 "N/A"

                row_items = [
                client_name,
                str(total_bw_count),
                str(total_color_count),
                str(average_bw_count),
                str(average_color_count),
                str(month_range),  # 统计月份
                str(month_count)
                ]
                areacounter_model.append(row_items)
        
 # 初始化总数和计数器
        total_bw_count = 0
        total_color_count = 0
        bw_non_zero_clients = 0
        color_non_zero_clients = 0

        # 遍历所有行，计算总黑白张数和总彩色张数，同时统计黑白张数和彩色张数不为0的客户数量
        for row in areacounter_model:
            bw_count = int(row[1])
            color_count = int(row[2])
            
            total_bw_count += bw_count
            total_color_count += color_count

            if bw_count > 0:
                bw_non_zero_clients += 1

            if color_count > 0:
                color_non_zero_clients += 1

        # 计算总黑白月平均张数和总彩色月平均张数
        avg_bw_count = total_bw_count // bw_non_zero_clients if bw_non_zero_clients > 0 else 0
        avg_color_count = total_color_count // color_non_zero_clients if color_non_zero_clients > 0 else 0


        return jsonify({
                    'reports':areacounter_model,
                    'bcounter': total_bw_count,
                    'ccounter': total_color_count,
                    'bavgcounter': avg_bw_count,
                    'cavgcounter': avg_color_count
                })            


    else:
        query = f"""
                        SELECT 
                                `ID`,
                                `日期`, 
                                `客戶名稱`, 
                                `機號`, 
                                `機型`, 
                                `黑白計數器`, 
                                `彩色計數器`, 
                                `彩色計數器2`, 
                                `維修情況`
                            FROM (
                                SELECT 
                                    `ID`,
                                    `日期`, 
                                    `客戶名稱`, 
                                    `機號`, 
                                    `機型`, 
                                    `黑白計數器`, 
                                    `彩色計數器`, 
                                    `彩色計數器2`, 
                                    `維修情況`,
                                    ROW_NUMBER() OVER (PARTITION BY `日期`, `黑白計數器`, `彩色計數器`, `彩色計數器2` ORDER BY `ID`) AS rn
                                FROM report_{table_name}
                                WHERE `日期` BETWEEN %s AND %s AND `客戶名稱` = %s 
                            AND NOT ((`黑白計數器` = 0 OR `黑白計數器` IS NULL) AND (`彩色計數器` = 0 OR `彩色計數器` IS NULL))
                            ) AS sub
                            WHERE rn = 1 
                            ORDER BY `ID`


                    """
        # 执行数据库查询
        conn = get_db_copier_connection()
        cursor = conn.cursor()
        cursor.execute(query, (start_date, end_date, customer_name))
        reports = cursor.fetchall()
        cursor.close()
        conn.close()

            # 如果没有找到数据，返回错误消息
        if not reports:
            return jsonify({'error':  '未找到相符的資料，請確認日期或客戶名稱是否正確'}), 400
        
        new_reports = []
        for row in reports:
            row = list(row)  # 将元组转换为列表
            for key in [5, 6, 7]:
                if row[key] is None:
                    row[key] = 0
            new_reports.append(row)  # 将修改后的列表添加到新的列表中
        last_row = None
        bw_count = 0
        color_count = 0
            
    
                # 遍历数据并计算差异
        for row in new_reports:
                # 处理 None 的情况
                row_維修情況 = row[8] if row[8] is not None else ""


                if last_row is not None  and last_row[4] == row[4] and "換機" not in row_維修情況 and "計數器變更" not in row_維修情況:
                    # 机号相同且維修情況不包含換機或計數器變更，计算差异并更新记录
                    bw_diff = row[5] - last_row[5]
                    color_diff = (row[6] +  row[7]) - (last_row[6] +  last_row[7])
                    row.append( bw_diff)
                    row.append(color_diff)
                    bw_count += bw_diff
                    color_count += color_diff
                else:
                    # 机号不同或維修情況包含換機或計數器變更，重置计数器
                    bw_count = row[5]
                    color_count = row[6]
                    row.append(0)
                    row.append(0)

                # 更新记录
                last_row = row

            # 初始化记录和计数器
        total_bw_count = 0
        total_color_count = 0

            # 将数据添加到模型中
        for row in new_reports:
                total_bw_count += row[9]
                total_color_count += row[10]

                    # 将日期转换为字符串
            # 获取日期对象的字符串表示
        start_date = new_reports[0][1]
        end_date = new_reports[-1][1]
        # 判断是否同年同月
        if start_date.year == end_date.year and start_date.month == end_date.month:
                if start_date.day != end_date.day:
                            month_difference = 1  # 同年同月但不同日，设为 1
                else:
                            month_difference = 0  # 同年同月同日，设为 0
        else:
                        month_difference = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month
            # 计算月份差
        if month_difference > 0:
                # 计算平均值并四舍五入
                average_bw_count = round(total_bw_count / month_difference)
                average_color_count = round(total_color_count / month_difference)

                    

        else:
                average_bw_count = 0
                average_color_count = 0


        # 将查询结果渲染到前端

        return jsonify({
            'reports': new_reports,
            'bcounter': total_bw_count,
            'ccounter': total_color_count,
            'bavgcounter': average_bw_count,
            'cavgcounter': average_color_count
        })
def fetch_and_process_client_data( start_date, end_date, customer_name, table_name):
        conn = get_db_copier_connection()
        cursor = conn.cursor(dictionary=True)
        query = f"""
            SELECT 
                `ID`,
                `日期`, 
                `客戶名稱`, 
                `機號`, 
                `機型`, 
                `黑白計數器`, 
                `彩色計數器`, 
                `彩色計數器2`, 
                `維修情況`
            FROM (
                SELECT 
                    `ID`,
                    `日期`, 
                    `客戶名稱`, 
                    `機號`, 
                    `機型`, 
                    `黑白計數器`, 
                    `彩色計數器`, 
                    `彩色計數器2`, 
                    `維修情況`,
                    ROW_NUMBER() OVER (PARTITION BY `日期`, `黑白計數器`, `彩色計數器`, `彩色計數器2` ORDER BY `ID`) AS rn
                FROM report_{table_name}
                WHERE `日期` BETWEEN %s AND %s AND `客戶名稱` = %s 
                AND NOT ((`黑白計數器` = 0 OR `黑白計數器` IS NULL) AND (`彩色計數器` = 0 OR `彩色計數器` IS NULL))
            ) AS sub
            WHERE rn = 1 
            ORDER BY `ID`
        """
        cursor.execute(query, (start_date, end_date, customer_name))
        rows = cursor.fetchall()
        cursor.close()
        if rows:
                return process_areacounter_data(rows)
        else:
                return []
def process_areacounter_data(data):
        for row in data:
            for key in ["黑白計數器", "彩色計數器", "彩色計數器2"]:
                if row[key] is None:
                    row[key] = 0
        
        last_row = None
        for row in data:
            row_維修情況 = row["維修情況"] if row["維修情況"] is not None else ""

            if last_row is not None and last_row["機型"] == row["機型"] and "換機" not in row_維修情況 and "計數器變更" not in row_維修情況:
                bw_diff = row["黑白計數器"] - last_row["黑白計數器"]
                color_diff = (row["彩色計數器"] +  row["彩色計數器2"]) - (last_row["彩色計數器"] +  last_row["彩色計數器2"])
                row["黑白張數"] = bw_diff
                row["彩色張數"] = color_diff
            else:
                row["黑白張數"] = 0
                row["彩色張數"] = 0

            last_row = row

        return data


       
# API端点：获取客户名称列表
@app.route('/api/get_area_counter_client_names', methods=['POST'])
def get_area_counter_client_names():
    user_class = request.json.get('queryAreaCounterType')
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

