from flask import Flask
import secrets

app = Flask(__name__, template_folder='templates')
app.secret_key = secrets.token_hex(16)
# 导入路由模块
from app import  routes
# 导入連接報表模塊
from app import report_db
# 导入新增客戶模塊
from app import addclient_db
# 导入修改客戶模塊
from app import modify_db
# 导入查詢客戶模塊
from app import query_db
# 導入張數記錄模塊
from app import reportcounter_db
# 導入機號模塊
from app import machinenumber_db