
document.addEventListener('DOMContentLoaded', function() {
    
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
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                showErrorModal(data.error);
                                return;
                            }
                            // 调试信息
                            //console.log('Fetched client info:', data);

                            document.getElementById('reportip').value = data.ip_address || '';
                            document.getElementById('reportmachinenumber').value = data.machine_number || '';
                            document.getElementById('reportmodal').value = data.machine_model || '';
                        });
                });

                fetch('/api/get_last_report_date')
                    .then(response => response.json())
                    .then(data => {
                        // 将日期输入框的默认值设置为当前日期
                        var today = new Date().toISOString().split('T')[0];
                        document.getElementById('reportdate').value = today;

                        // 获取最后报表日期，并转换为Date对象
                        var lastReportDate = new Date(data.last_report_date);

                        // 日期输入框变化事件处理
                        document.getElementById('reportdate').addEventListener('change', function() {
                            var inputDate = new Date(this.value);
                            if (inputDate < lastReportDate) {
                                showErrorModal('日期不能早于日報表最後日期！');
                                this.value = today; // 重置为默认日期
                            }
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
                            };
                            var reportip = document.getElementById('reportip').value;
                            var reportmachinenumber = document.getElementById('reportmachinenumber').value;
                            var reportmodal = document.getElementById('reportmodal').value;
                            var reportbcounter = document.getElementById('reportbcounter').value;
                            var reportccounter = document.getElementById('reportccounter').value;
                            var reportccounter2 = document.getElementById('reportccounter2').value;
                            var reportpart = document.getElementById('reportpart').value;
                            var reportpartcounter = document.getElementById('reportpartcounter').value;
                            var reportservice = document.getElementById('reportservice').value;

                            report = {
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
                            lastReportData = {
                                reportdate,
                                reportclientname,
                                reportip,
                                reportmachinenumber,
                                reportmodal,
                                reportbcounter,
                                reportccounter,
                                reportccounter2,
                                reportservice
                            };

                            // 检查客户名称和机号是否存在
                            fetch(`/api/check_client_exists?client_name=${encodeURIComponent(reportclientname)}`)
                                .then(response => response.json())
                                .then(data => {
                                     // 调试信息
                                     //console.log('Check client exists response:', data.client_exists);
                                     //console.log('Report machine number:', data.machine_number);
                                     //console.log('Report IP:', data.ip_address);
 
                                    if (data.client_exists) { // 这里根据服务端返回的字段来判断客户是否存在
                                        // 检查机号和IP地址是否需要更新
                                        if ((reportmachinenumber && reportmachinenumber !== data.machine_number) || 
                                            (reportip && reportip !== data.ip_address) ||
                                            (!data.machine_number && reportmachinenumber) ||
                                            (!data.ip_address && reportip)) {
                                            
                                            // 更新客户信息
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
                                                    showSuccessModal(`客戶:${reportclientname}的IP_${reportip}，機號：${reportmachinenumber}已更新！`);
                                                    // 更新成功后提交日报表数据
                                                    submitDailyReport(report);
                                                }
                                            })
                                            .catch(err => {
                                                console.error('無法更新客戶信息:', err);
                                                showErrorModal('無法更新客戶信息，請稍後再試');
                                            });
                                        } else {
                                            // 客户信息无需更新，直接提交日报表数据
                                            submitDailyReport(report);
                                        }
                                    } else {
                                        // 客户名称和机号不存在，询问是否添加
                                        modalDialog('未登錄的客戶名稱和機號，是否要添加？').then((confirmed) => {
                                            if (confirmed) {
                                                // 添加客户信息到数据库
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
                                                        // 添加成功后提交日报表数据
                                                        showSuccessModal(`客戶:${reportclientname}已新增！`);
                                                        submitDailyReport(report);
                                                    }
                                                })
                                                .catch(err => {
                                                    console.error('無法添加客戶信息:', err);
                                                    showErrorModal('無法添加客戶信息，請稍後再試');
                                                });
                                            } else {
                                                // 用户选择不添加新客户信息，直接提交日报表数据
                                                submitDailyReport(report);
                                            }
                                        });
                                    }
                                })
                                .catch(err => {
                                    console.error('檢查客戶名稱和機號失敗:', err);
                                    showErrorModal('檢查客戶名稱和機號失敗，請稍後再試');
                                });
                        });
                    })
                    .catch(err => {
                        console.error('無法讀取日報表最後日期:', err);
                        showErrorModal('無法讀取日報表最後日期，請稍後再試:');
                    });
            });
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

                document.getElementById('savePartButton').addEventListener('click', function() {
                    var newPartNumber = document.getElementById('newPartNumber').value;
                    var newPartQuantity = document.getElementById('newPartQuantity').value;

                    if (!newPartNumber || !newPartQuantity) {
                        showErrorModal('請填寫所有輸入框');
                        return;
                    }

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
                            }
                        })
                        .catch(err => {
                            console.error('提交失敗:', err);
                            showErrorModal('提交失敗，請稍後再試');
                        });

                    var partModalInstance = bootstrap.Modal.getInstance(document.getElementById('partModal'));
                    partModalInstance.hide();
                    showSuccessModal('零件料號已成功添加！');
                });
            });
    });

   
}
 // 輸入下一筆資料
 function nextData() {
    document.getElementById('addNextButton').addEventListener('click', function() {
        // 保留日期
        var previousDate = document.getElementById('reportdate').value;

        // 重置表單
        document.getElementById('dailyReportForm').reset();

        // 恢復日期
        document.getElementById('reportdate').value = previousDate;

         // 更新客户名称列表
         fetchClientNames();
        

        var nextDailyReportModal = new bootstrap.Modal(document.getElementById('dailyReportModal'));
        nextDailyReportModal.show();

    });
}

    //獲取資料庫中的客戶
    function fetchClientNames() {
        return fetch('/api/get_client_names')
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
        }
    

    // 提交日报表的函数
    function submitDailyReport(reportData) {
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
            showSuccessModal('日報表已成功添加！');
            // 顯示增加料號和輸入下一筆按鈕
            document.getElementById('addPartButton').style.display = 'inline-block';
            document.getElementById('addNextButton').style.display = 'inline-block';

        })
        .catch(err => {
            console.error('無法添加日報表:', err);
            showErrorModal('無法添加日報表，請稍後再試');
        });
    }
