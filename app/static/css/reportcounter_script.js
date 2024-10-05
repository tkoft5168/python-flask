document.addEventListener('DOMContentLoaded', function() {
    const reportCounterModal = document.getElementById('reportCounterModal');
    const reportCounterForm = document.getElementById('reportCounterForm');
    
    if (reportCounterModal) {
        reportCounterModal.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/initweb/reportcounter';
        });
    }
    
    if (reportCounterForm) {
        // 设置结束日期为当前日期
        const queryToday = new Date().toISOString().split('T')[0];
        document.getElementById('endDate').value = queryToday;

        // 更新客户名称列表
        queryFetchClientNames();

        // 处理查询按钮点击事件
        document.getElementById("queryButton").addEventListener("click", function(e) {
            e.preventDefault(); // 防止表单的默认提交行为

            const formData = new FormData(document.getElementById("reportCounterForm"));

            fetch("/report_counter", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showErrorModal(data.error);
                } else {
                // 假設表格 ID 為 'reportCounterTable'
                const tableBody = document.querySelector("#reportCounterTable tbody");
                tableBody.innerHTML = ''; // 清空現有行

                data.reports.forEach(row => {
                    const tr = document.createElement('tr');

                    row.forEach((cell, index) => {
                        const td = document.createElement('td');

                        // 如果是日期列，進行格式化
                        if (index === 1) { // 假設日期在第二列（索引為 1）
                            const date = new Date(cell);
                            const formattedDate = date.toISOString().split('T')[0]; // 格式化為 YYYY-MM-DD
                            td.textContent = formattedDate;
                        } else {
                            td.textContent = cell || ''; // 如果單元格為 null 或 undefined，顯示空字符串
                        }

                        tr.appendChild(td);
                    });

                    tableBody.appendChild(tr);
                });

                // 更新結果部分
                document.getElementById("bcounter").textContent = data.bcounter;
                document.getElementById("ccounter").textContent =  data.ccounter;
                document.getElementById("bavgcounter").textContent =  + data.bavgcounter;
                document.getElementById("cavgcounter").textContent =  + data.cavgcounter;

                // 顯示結果部分
                document.getElementById("result").style.display = "block";
            }
        })
        .catch(error => console.error("Error:", error));
    });
    }
});

// 获取数据库中的客户名称
function queryFetchClientNames() {
    return fetch('/api/get_client_names')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showErrorModal(data.error);
                return;
            }
            const clientNames = data.client_names;
            const dataList = document.getElementById('customerNameList');
            dataList.innerHTML = ''; // 清空现有选项
            clientNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                dataList.appendChild(option);
            });
        })
        .catch(err => {
            console.error('無法讀取客戶名稱列表:', err);
            showErrorModal('無法讀取客戶名稱列表，請稍候再試！');
        });
}



// 管理者頁面張數查詢，在页面加载时，设置结束日期为当前日期，并监听区域选择的变化

const areaReportCounterForm = document.getElementById('areaReportCounterForm');
    if(areaReportCounterForm){
    const queryToday = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = queryToday;

    document.getElementById('queryAreaCounterType').addEventListener('change', function() {
        const queryAreaCounterType = document.getElementById('queryAreaCounterType').value;
        // 更新客户名称列表
        AreaoCunterFetchClientNames(queryAreaCounterType);
    });

    areaReportCounterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(areaReportCounterForm);
        
  
        fetch("/area_report_counter", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showErrorModal(data.error);
            } else {
                const customerName = document.getElementById('customerName').value;
                if (customerName === null || customerName.trim() === '') {
                    displayMultipleClientsData(data);
                    
                } else {
                    displaySingleClientData(data);
                }

            }


        })
        .catch(error => console.error("Error:", error));

    });

}


function displaySingleClientData(data) {
    const tableBody = document.querySelector("#areaReportCounterTable tbody");
    tableBody.innerHTML = '';
    data.reports.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            if (index === 1) {
                const date = new Date(cell);
                td.textContent = date.toISOString().split('T')[0];
            } else {
                td.textContent = cell || '';
            }
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    document.getElementById("areaBcounter").textContent = data.bcounter;
    document.getElementById("areaCcounter").textContent = data.ccounter;
    document.getElementById("areaBavgcounter").textContent = data.bavgcounter;
    document.getElementById("areaCavgcounter").textContent = data.cavgcounter;
     // 顯示結果部分
    document.getElementById("areaCounterResult").style.display = "block";
    document.getElementById("areaReportCounterTable").style.display = "table";
    document.getElementById("multipleClientsTable").style.display = "none";
}

function displayMultipleClientsData(data) {
    const tableBody = document.querySelector("#multipleClientsTable tbody");
    tableBody.innerHTML = '';
    data.reports.forEach(clientData => {
        const tr = document.createElement('tr');
        clientData.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
    document.getElementById("areaBcounter").textContent = data.bcounter;
    document.getElementById("areaCcounter").textContent = data.ccounter;
    document.getElementById("areaBavgcounter").textContent = data.bavgcounter;
    document.getElementById("areaCavgcounter").textContent = data.cavgcounter;

    document.getElementById("areaCounterResult").style.display = "block";
    document.getElementById("multipleClientsTable").style.display = "table";
    document.getElementById("areaReportCounterTable").style.display = "none";
}

function showErrorModal(message) {
    alert(message);
}


// 获取并填充客户名称列表
function AreaoCunterFetchClientNames(queryAreaCounterType) {
    fetch('/api/get_area_counter_client_names', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queryAreaCounterType: queryAreaCounterType })
    })
    .then(response => response.json())
    .then(data => {
        const dataList = document.getElementById('customerNameList');
        dataList.innerHTML = '';  // 清空现有选项
        data.client_names.forEach(function(name) {
            const option = document.createElement('option');
            option.value = name;
            dataList.appendChild(option);
        });
    })
    .catch(err => {
        console.error('無法讀取客戶名稱列表:', err);
        showErrorModal('無法讀取客戶名稱列表，請稍後再試！');
    });
}
