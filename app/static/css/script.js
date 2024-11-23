
document.addEventListener('DOMContentLoaded', function() {

    let logoutTimer;

// 重置计时器的函数
function resetLogoutTimer() {
    clearTimeout(logoutTimer);
    // 设置5分钟（300,000毫秒）的无操作自动登出时间
    logoutTimer = setTimeout(() => {
        alert("因長時間無操作，您將被自動登出。");
        window.location.href = '/'; // 调用后端登出接口
    }, 300000); // 5分鐘
}

// 监听用户活动
window.onload = resetLogoutTimer;
document.onmousemove = resetLogoutTimer;
document.onkeypress = resetLogoutTimer;
document.onscroll = resetLogoutTimer;
    
    document.getElementById('openDailyReportModal').addEventListener('click', function(event) {
        event.preventDefault();
        // 显示日报表模态框
        window.location.href = '/initweb/user_report?openModal=true';
    });

    // 检查 URL 参数，决定是否打开模态框
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openModal') === 'true') {
        fetch('/modal/daily_report_modal.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('modalPlaceholder').innerHTML = html;
                var dailyReportModal = new bootstrap.Modal(document.getElementById('dailyReportModal'));
                dailyReportModal.show();
                document.getElementById('dailyReportModal').addEventListener('shown.bs.modal', function() {
                //護取報表最後日期
                lastReportdate();

                })
                var today = new Date().toISOString().split('T')[0];
                document.getElementById('reportdate').value = today;
                // 获取客户名称列表
                fetchClientNames();

               
                // 监听客户名称输入框的变化事件
                document.getElementById('reportclientname').addEventListener('change', function() {
                    var clientName = this.value;
                    if (!clientName) {
                        
                        return; // 不发送空请求
                    }
                    // 获取客户信息并填入输入框
                    fetch(`/api/get_client_info?client_name=${encodeURIComponent(clientName)}`)
                   .then(response => {
                   // 检查是否为 204 No Content 响应
                    if (response.status === 204) {
                   // 返回空数据对象，因为服务器没有返回内容
                   return {};
                  }
                 // 确保返回的是 JSON 格式
                  return response.json();
                  })
                  .then(data => {
                 // 如果没有返回数据，不需要继续处理
                  if (!data || Object.keys(data).length === 0) {
                  console.log('No data returned from the server.');
                  return;
                  }
                            // 调试信息
                            //console.log('Fetched client info:', data);

                            document.getElementById('reportip').value = data.ip_address || '';
                            document.getElementById('reportmachinenumber').value = data.machine_number || '';
                            document.getElementById('reportmodal').value = data.machine_model || '';
                        });
                });

                

                        // 提交日报表表单事件处理
                        document.getElementById('dailyReportForm').addEventListener('submit', function(event) {
                            event.preventDefault();
                        
                            // 获取表单数据
                            var reportdate = document.getElementById('reportdate').value;
                            var reportclientname = document.getElementById('reportclientname').value;
                        
                            // 检查日期和客户名称是否填写
                            if (!reportdate || !reportclientname) {
                                showErrorModal('日期和客戶名稱為必填項目！');
                                return;
                            }
                        
                            var reportip = document.getElementById('reportip').value;
                            var reportmachinenumber = document.getElementById('reportmachinenumber').value;
                            var reportmodal = document.getElementById('reportmodal').value;
                            var reportbcounter = document.getElementById('reportbcounter').value;
                            var reportccounter = document.getElementById('reportccounter').value;
                            var reportccounter2 = document.getElementById('reportccounter2').value;
                            var reportpart = document.getElementById('reportpart').value;
                            var reportpartcounter = document.getElementById('reportpartcounter').value;
                            var reportservice = document.getElementById('reportservice').value;
                        
                            var report = {
                                report_date: reportdate,
                                report_client_name: reportclientname,
                                report_ip: reportip || '',
                                report_machine_number: reportmachinenumber || '',
                                report_modal: reportmodal || '',
                                report_b_counter: reportbcounter || '',
                                report_c_counter: reportccounter || '',
                                report_c_counter2: reportccounter2 || '',
                                report_part: reportpart || '',
                                report_part_counter: reportpartcounter || '',
                                report_service: reportservice || ''
                            };
                        
                            // 保存日报表数据以便后续使用
                            lastReportData = { reportdate, reportclientname, reportip, reportmachinenumber, reportmodal, reportbcounter, reportccounter, reportccounter2, reportservice };
                        
                            // 禁用提交按钮，防止重复提交
                            var submitButton = document.querySelector('#dailyReportForm button[type="submit"]');
                            submitButton.disabled = true;
                        
                            // 检查客户名称和机号是否存在
                            fetch(`/api/check_client_exists?client_name=${encodeURIComponent(reportclientname)}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.client_exists) {
                                        // 更新客户信息
                                        handleClientUpdate(data, report, reportclientname, reportmachinenumber, reportip);
                                    } else {
                                        // 客户不存在，询问是否添加
                                        modalDialog('未登錄的客戶名稱和機號，是否要添加？').then((confirmed) => {
                                            if (confirmed) {
                                                addNewClient(report, reportclientname, reportmachinenumber, reportmodal, reportip);
                                            } else {
                                                submitDailyReport(report)
                                                    .then(() => showSuccessModal(`日報表已成功添加！`))
                                                    .catch(err => {
                                                        console.error('提交日報表失敗:', err);
                                                        showErrorModal('提交日報表失敗，請稍後再試');
                                                    });
                                            }
                                        });
                                    }
                                })
                                .catch(err => {
                                    console.error('檢查客戶名稱和機號失敗:', err);
                                    showErrorModal('檢查客戶名稱和機號失敗，請稍後再試');
                                })
                                .finally(() => {
                                    submitButton.disabled = false;  // 重新启用提交按钮
                                });
                        });
                        
                        function handleClientUpdate(data, report, reportclientname, reportmachinenumber, reportip) {
                            if ((reportmachinenumber && reportmachinenumber !== data.machine_number) ||
                                (reportip && reportip !== data.ip_address) ||
                                (!data.machine_number && reportmachinenumber) ||
                                (!data.ip_address && reportip)) {
                                
                                fetch('/api/update_client', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        client_name: reportclientname,
                                        machine_number: reportmachinenumber,
                                        ip_address: reportip
                                    })
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.error) {
                                        showErrorModal(data.error);
                                    } else {
                                        submitDailyReport(report)
                                            .then(() => showSuccessModal(`客戶:${reportclientname}的IP_${reportip}，機號：${reportmachinenumber}已更新！\n日報表已成功添加！`))
                                            .catch(err => {
                                                console.error('提交日報表失敗:', err);
                                                showErrorModal('提交日報表失敗，請稍後再試');
                                            });
                                    }
                                })
                                .catch(err => {
                                    console.error('無法更新客戶信息:', err);
                                    showErrorModal('無法更新客戶信息，請稍後再試');
                                });
                            } else {
                                submitDailyReport(report)
                                    .then(() => showSuccessModal(`日報表已成功添加！`))
                                    .catch(err => {
                                        console.error('提交日報表失敗:', err);
                                        showErrorModal('提交日報表失敗，請稍後再試');
                                    });
                            }
                        }
                        
                        function addNewClient(report, reportclientname, reportmachinenumber, reportmodal, reportip) {
                            fetch('/api/add_client', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    client_name: reportclientname,
                                    machine_number: reportmachinenumber,
                                    machine_model: reportmodal,
                                    ip_address: reportip
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.error) {
                                    showErrorModal(data.error);
                                } else {
                                    submitDailyReport(report)
                                        .then(() => showSuccessModal(`客戶:${reportclientname}已新增！\n日報表已成功添加！`))
                                        .catch(err => {
                                            console.error('提交日報表失敗:', err);
                                            showErrorModal('提交日報表失敗，請稍後再試');
                                        });
                                }
                            })
                            .catch(err => {
                                console.error('無法添加客戶信息:', err);
                                showErrorModal('無法添加客戶信息，請稍後再試');
                            });
                        }
                        
                    })
                   
           
    }

});
    const dailyReportTable = document.getElementById('dailyReportTable');
    if  (dailyReportTable) {
    
    addPartListener();
    nextData();
    };
    // 增加料號程式
    function addPartListener() {
        document.getElementById('addPartButton').addEventListener('click', function() {
            fetch('/modal/part_modal.html')
                .then(response => response.text())
                .then(html => {
                    document.getElementById('modalPlaceholder2').innerHTML = html;
    
                    var partModal = new bootstrap.Modal(document.getElementById('partModal'));
                    partModal.show();
    
                    // 先移除旧的监听器，防止重复添加
                    document.getElementById('savePartButton').removeEventListener('click', savePart);
                    document.getElementById('savePartButton').addEventListener('click', savePart);
                })
                .catch(err => {
                    console.error('讀取 part_modal.html 錯誤:', err);
                    showErrorModal('無法加載零件模態框，請稍後再試');
                });
        });
    }
    
    function savePart() {
        var newPartNumber = document.getElementById('newPartNumber').value;
        var newPartQuantity = document.getElementById('newPartQuantity').value;
    
        if (!newPartNumber || !newPartQuantity) {
            showErrorModal('請填寫所有輸入框');
            return;
        }
    
        // 禁用按钮以防止多次点击提交
        var saveButton = document.getElementById('savePartButton');
        saveButton.disabled = true;
    
        // 插入新行到表格中
        var newRow = `<tr>
                        <td>${lastReportData.reportdate}</td>
                        <td>${lastReportData.reportclientname}</td>
                        <td>${lastReportData.reportip}</td>
                        <td>${lastReportData.reportmachinenumber}</td>
                        <td>${lastReportData.reportmodal}</td>
                        <td>${lastReportData.reportbcounter}</td>
                        <td>${lastReportData.reportccounter}</td>
                        <td>${lastReportData.reportccounter2}</td>
                        <td>${newPartNumber}</td>
                        <td>${newPartQuantity}</td>
                        <td>${lastReportData.reportservice}</td>
                      </tr>`;
        document.querySelector('#dailyReportTable tbody').insertAdjacentHTML('beforeend', newRow);
    
        // 提交数据到服务器
        fetch('/api/add_daily_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                report_date: lastReportData.reportdate,
                report_client_name: lastReportData.reportclientname,
                report_machine_number: lastReportData.reportmachinenumber || '',
                report_modal: lastReportData.reportmodal || '',
                report_b_counter: lastReportData.reportbcounter || '',
                report_c_counter: lastReportData.reportccounter || '',
                report_c_counter2: lastReportData.reportccounter2 || '',
                report_part: newPartNumber || '',
                report_part_counter: newPartQuantity || '',
                report_service: lastReportData.reportservice || ''
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showErrorModal(data.error || '提交失敗');
                saveButton.disabled = false;  // 如果出错，重新启用按钮
                return;
            }
    
            // 提交成功，关闭模态框
            var partModalInstance = bootstrap.Modal.getInstance(document.getElementById('partModal'));
            partModalInstance.hide();
            showSuccessModal('零件料號已成功添加！');
        })
        .catch(err => {
            console.error('提交失敗:', err);
            showErrorModal('提交失敗，請稍後再試');
            saveButton.disabled = false;  // 重新启用按钮
        });
    }


    function lastReportdate() {
        fetch('/api/get_last_report_date')
        .then(response => response.json())
        .then(data => {

    
            var lastReportDate = new Date(data.last_report_date);
            var formattedLastReportDate = lastReportDate.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            var today = new Date().toISOString().split('T')[0];

            // 在输入框旁边显示最后报表日期
            document.getElementById('lastReportDateLabel').innerText = `(最後報表日期: ${formattedLastReportDate})`;
    
            document.getElementById('reportdate').addEventListener('blur', function() {
                var inputDate = new Date(this.value);
                if (inputDate < lastReportDate) {
                    showErrorModal('日期不能早于日報表最後日期！');
                    this.value = today; // 重置为默认日期
                }
            });
            return Promise.resolve();  // 确保返回一个 Promise
        })
        .catch(err => {
            console.error('無法讀取日報表最後日期:', err);
            showErrorModal('無法讀取日報表最後日期，請稍後再試');
        });
    }

    function nextData() {
        document.getElementById('addNextButton').addEventListener('click', function() {
            // 从服务器获取最后报表日期并设置为日期输入框
            fetch('/api/get_last_report_date')
            .then(response => response.json())
            .then(data => {
                console.log('返回的日期数据:', data);
    
                if (data && data.last_report_date) {
                    var lastReportDate = new Date(data.last_report_date);
                    console.log('格式化前的日期对象:', lastReportDate);
    
                    // 格式化为 YYYY-MM-DD
                    var formattedLastReportDate = lastReportDate.toISOString().split('T')[0];
                    console.log('格式化后的日期:', formattedLastReportDate);
    
                    // 设置日期为最后报表日期
                    document.getElementById('reportdate').value = formattedLastReportDate;
                } else {
                    console.error('未能正确获取 last_report_date');
                    showErrorModal('未能正确获取日報表最後日期');
                }
    
                // 重置表单（设置完日期后调用）
                document.getElementById('dailyReportForm').reset();
    

    
                // 更新客户名称列表
                fetchClientNames();
    
                // 打开模态框
                var nextDailyReportModal = new bootstrap.Modal(document.getElementById('dailyReportModal'));
                nextDailyReportModal.show();
                                // 恢复日期为最后报表日期
                                document.getElementById('reportdate').value = formattedLastReportDate;
            })
            .catch(err => {
                console.error('無法讀取日報表最後日期:', err);
                showErrorModal('無法讀取日報表最後日期，請稍後再試');
            });
        });
    }
    
    //獲取資料庫中的客戶
    function fetchClientNames() {
    fetch('/api/get_client_names')
            .then(response => response.json())
            .then(data => {

                if (data.error) {
                    showErrorModal(data.error);
                    return;
                }
                var clientNames = data.client_names;
                var dataList = document.getElementById('clientnames');
                dataList.innerHTML = ''; // 清空现有选项
                clientNames.forEach(function(name) {
                    var option = document.createElement('option');
                    option.value = name;
                    dataList.appendChild(option);
                });
            })
            .catch(err => {
                console.error('無法讀取客戶名稱列表:', err);
                showErrorModal('無法讀取客戶名稱列表，請稍後再試');
            });
            return Promise.resolve();  // 确保返回一个 Promise
        }
    

  // 提交日报表的函数
  function submitDailyReport(reportData) {
    return new Promise((resolve, reject) => {
        fetch('/api/add_daily_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showErrorModal(data.error);
                reject(data.error); // 发生错误时拒绝 Promise
                return;
            }

            // 构建新行并插入表格中
            var newRow = `<tr>
                            <td>${reportData.report_date}</td>
                            <td>${reportData.report_client_name}</td>
                            <td>${reportData.report_ip}</td>
                            <td>${reportData.report_machine_number}</td>
                            <td>${reportData.report_modal}</td>
                            <td>${reportData.report_b_counter}</td>
                            <td>${reportData.report_c_counter}</td>
                            <td>${reportData.report_c_counter2}</td>
                            <td>${reportData.report_part}</td>
                            <td>${reportData.report_part_counter}</td>
                            <td>${reportData.report_service}</td>
                          </tr>`;
            document.querySelector('#dailyReportTable tbody').insertAdjacentHTML('beforeend', newRow);

            // 重置表单并隐藏模态框
            var dailyReportModalInstance = bootstrap.Modal.getInstance(document.getElementById('dailyReportModal'));
            dailyReportModalInstance.hide();

            // 顯示增加料號和輸入下一筆按鈕
            document.getElementById('addPartButton').style.display = 'inline-block';
            document.getElementById('addNextButton').style.display = 'inline-block';

            resolve(data); // 成功时解析 Promise，传递数据
        })
        .catch(err => {
            console.error('無法添加日報表:', err);
            showErrorModal('無法添加日報表，請稍後再試');
            reject(err); // 出现错误时拒绝 Promise
        });
    });
}

