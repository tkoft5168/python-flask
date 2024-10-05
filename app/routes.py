from flask import render_template, request, redirect, url_for, flash, session 
import pandas as pd
from datetime import datetime
from calendar import monthrange
from app import app
from db import get_db_connection,get_db_copier_connection

@app.route('/')
def index():

    return render_template('login.html')


@app.route('/login', methods=['POST'])

def login():

    username = request.form['username']
    password = request.form['password']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT class FROM login WHERE user = %s AND password = %s ', (username, password))
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()

    if user_data:
        session['class'] = user_data.get('class')
        if session['class'] == "管理者":
            return redirect(url_for('admin_index'))
        elif session['class'] =="業務":
            return render_template('sales.html')
        else:
            return redirect(url_for('initweb'))

    else:
        flash('登錄失敗。請檢查您的用戶名和密碼。')
        return redirect(url_for('index'))

@app.route('/sales')    
def sales():
    user_class = session.get('class')
    if user_class == "業務":
        return render_template('sales.html', user_class = user_class)

    else:
        return  '', 404  # 返回无内容响应
    

@app.route('/admin_index')    
def admin_index():
    user_class = session.get('class')
    if user_class == "管理者":
        return render_template('admin_index.html', user_class = user_class)

    else:
        return  '', 404  # 返回无内容响应
    
from datetime import datetime
from flask import request, render_template, session

@app.route('/admin/dashboard', methods=['GET', 'POST'])
def admin_dashboard():
    user_class = session.get('class')
    if user_class == "管理者":
        today = datetime.today()
        
        # 处理表单提交的月份
        if request.method == 'POST':
            selected_month = request.form.get('startMonth')  # 获取选择的月份
            if selected_month:
                # 将选中的月份转为 datetime 对象
                start_date = datetime.strptime(selected_month + "-01", "%Y-%m-%d")  # 月份的第一天

                # 如果选择的是当前月份，end_date 是今天，否则是该月份的最后一天
                if start_date.year == today.year and start_date.month == today.month:
                    end_date = today
                else:
                    # 获取该月份的最后一天
                    last_day_of_month = monthrange(start_date.year, start_date.month)[1]
                    end_date = start_date.replace(day=last_day_of_month)
            else:
                # 如果未选择月份，则默认本月的第一天到今天
                start_date = today.replace(day=1)
                end_date = today
        else:
            # 默认情况下使用本月第一天到今天
            start_date = today.replace(day=1)
            end_date = today
         # 区域英文到中文的映射
        area_mapping = {
            "douliu": "斗六區",
            "dounan": "斗南區",
            "huwei": "虎尾區",
            "xiluo": "西螺區",
            "yunlin": "雲科大"
        }

        areas = ["douliu", "dounan", "huwei", "xiluo", "yunlin"]  # 各區域名稱
        result = {}

        for area in areas:
            conn = get_db_copier_connection()
            cursor = conn.cursor(dictionary=True)

            try:
                # 查询客户表中的客户名称
                client_query = f"SELECT 客戶名稱 FROM client_{area}"
                cursor.execute(client_query)
                client_names = [row['客戶名稱'] for row in cursor.fetchall()]

                # 查询报告表中符合时间范围的客户名称
                report_query = f"""
                    SELECT DISTINCT 客戶名稱
                    FROM report_{area}
                    WHERE `日期` BETWEEN %s AND %s
                """
                cursor.execute(report_query, (start_date, end_date))
                report_client_names = [row['客戶名稱'] for row in cursor.fetchall()]

                # 计算总客户数与与报表相同的客户数
                total_clients = len(client_names)
                matched_clients = len(set(client_names).intersection(set(report_client_names)))

                # 将每个区域的结果保存到 result 字典中
                result[area_mapping[area]] = {  # 使用中文区域名
                    'total_clients': total_clients,
                    'matched_clients': matched_clients
                }
            finally:
                # 确保关闭游标和连接
                cursor.close()
                conn.close()

        formatted_start_date = start_date.strftime('%Y-%m-%d')
        formatted_end_date = end_date.strftime('%Y-%m-%d')

        # 渲染模板并传递统计结果
        return render_template('dashboard.html', 
                               result=result, 
                               user_class=user_class, 
                               formatted_start_date=formatted_start_date, 
                               formatted_end_date=formatted_end_date)
    else:
        return '', 404  # 返回無內容響應

@app.route('/admin/modifyclient')
def admin_modifyclient():
    user_class = session.get('class')
    if user_class == "管理者" or "業務":
        return render_template('admin_modifyclient.html', user_class = user_class)
    else:
        return  '', 404  # 返回无内容响应 
@app.route('/admin/machinenumber')
def admin_machinenumber():
    user_class = session.get('class')
    if user_class == "管理者":
        return render_template('admin_machinenumber.html', user_class = user_class)
    else:
        return  '', 404  # 返回无内容响应 
    
@app.route('/admin/reportquery')
def admin_reportquery():
    user_class = session.get('class')
    if user_class == "管理者":
        return render_template('admin_reportquery.html', user_class = user_class)
    else:
        return  '', 404  # 返回无内容响应 
    
@app.route('/admin/counterquery')
def admin_counterquery():
    user_class = session.get('class')
    if user_class == "管理者" or "業務":
        return render_template('admin_counterquery.html', user_class = user_class)
    else:
        return  '', 404  # 返回无内容响应 



@app.route('/admin_user')
def admin_user():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT num, user, class FROM login')
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('admin_user.html', users=users)

@app.route('/add_user', methods=['POST'])

def add_user():
    username = request.form['username']
    password = request.form['password']
    user_class = request.form['class']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 检查用户名是否已存在
    cursor.execute('SELECT * FROM login WHERE user = %s', (username,))
    existing_user = cursor.fetchone()
    
    if existing_user:
        flash('用戶名已存在，請選擇其他用戶名。')
    else:
        cursor.execute('INSERT INTO login (user, password, class) VALUES (%s, %s, %s)', (username, password, user_class))
        conn.commit()
        flash('用戶新增成功！')
    
    cursor.close()
    conn.close()
    
    return redirect(url_for('admin_user'))

@app.route('/delete_user/<int:user_id>')

def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM login WHERE num = %s', (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    
    flash('用戶刪除成功！')
    return redirect(url_for('admin_user'))
@app.route('/edit_user/<int:user_id>', methods=['GET', 'POST'])

def edit_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM login WHERE num = %s', (user_id,))
    user = cursor.fetchone()

    if request.method == 'POST':
        password = request.form['password']
        user_class = request.form['class']
        
        cursor.execute('UPDATE login SET password = %s, class = %s WHERE num = %s', (password, user_class, user_id))
        conn.commit()
        cursor.close()
        conn.close()

        flash('用戶信息已更新')
        return redirect(url_for('admin_user'))
    else:
        return render_template('edit_user.html', user=user)


@app.route('/initweb')
def initweb():
    user_class = session.get('class')
    return render_template('base.html', user_class = user_class)

@app.route('/modal/<path:filename>')
def serve_modal(filename):
    return render_template(f'modal/{filename}')

@app.route('/initweb/user_report')
def user_report_page():
    user_class = session.get('class')
    openModal = request.args.get('openModal', 'false') == 'true'
    return render_template('user_report.html', user_class=user_class, openModal=openModal)

@app.route('/initweb/addclient')
def add_client_page():
    user_class = session.get('class')
    return render_template('addclient.html', user_class=user_class)

@app.route('/initweb/modifyclient')
def modify_client_page():
    user_class = session.get('class')
    return render_template('modifyclient.html',user_class=user_class)


@app.route('/initweb/queryreport')
def query_report_page():    
    user_class = session.get('class')
    return render_template('query_report.html',user_class=user_class)

@app.route('/initweb/reportcounter')
def report_counter_page():
    user_class = session.get('class')
    return render_template('reportcounter.html',user_class=user_class)

@app.route('/logout', methods=['POST'])

def logout():

    session.clear()  # 清除会话数据
    return '', 204  # 返回无内容响应