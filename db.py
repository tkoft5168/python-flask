import mysql.connector

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host='mysql5339893.ausucomm.com',
            user='admin',
            password='19931014',
            database='user'
        )
        return conn
    except mysql.connector.Error as e:
        print("無法連接到MySQL資料庫:", e)
        return None
def get_db_copier_connection():
    try:
        conn = mysql.connector.connect(
            host='mysql5339893.asuscomm.com',
            user='admin',
            password='19931014',
            database='copier'
        )
        return conn
    except mysql.connector.Error as e:
        print("無法連接到MySQL資料庫:", e)
        return None
