document.addEventListener('DOMContentLoaded', function() {

    initializeQueryReportPage();

    
});

function initializeQueryReportPage() {
    const queryReportModal = document.getElementById('queryReportModal');
    const queryForm = document.getElementById('queryForm');
    
    if (queryReportModal) {
        queryReportModal.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/initweb/queryreport';
        });
        
        if (queryForm) {
            const queryToday = new Date().toISOString().split('T')[0];
            document.getElementById('endDate').value = queryToday;
            queryFetchClientNames();
            initializeEditAndDeleteButtons();
            initializeSaveButton();
        }
    }
}

function initializeEditAndDeleteButtons() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    editButtons.forEach(button => {
        button.addEventListener('click', handleEditButtonClick);
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteButtonClick);
    });
}

function handleEditButtonClick() {
    const reportId = this.dataset.id;
    fetch(`/get_report_by_id/${reportId}`)
        .then(response => response.json())
        .then(data => {
            populateEditForm(data);
            const modal = new bootstrap.Modal(document.getElementById('editReportModal'));
            modal.show();
        });
}

function handleDeleteButtonClick() {
    const reportId = this.dataset.id;
    if (confirm('確定要刪除此報表嗎？')) {
        fetch('/delete_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ report_id: reportId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('報表已刪除');
                location.reload();
            } else {
                alert('刪除失敗');
            }
        });
    }
}

function initializeSaveButton() {
    document.getElementById('saveEditReportButton').addEventListener('click', function() {
        saveEditedReport();
    });
}

function populateEditForm(data) {

    document.getElementById('reportId').value = data.ID;
    document.getElementById('editCustomerName').value = data.客戶名稱;
    document.getElementById('editMachineNumber').value = data.機號;
    document.getElementById('editMachineModel').value = data.機型;
    document.getElementById('editBWCounter').value = data.黑白計數器;
    document.getElementById('editColorCounter').value = data.彩色計數器;
    document.getElementById('editColorCounter2').value = data.彩色計數器2;
    document.getElementById('editPartNumber').value = data.更換零件料號;
    document.getElementById('editQuantity').value = data.數量;
    document.getElementById('editRepairContent').value = data.維修情況;
}

function saveEditedReport() {
    const reportId = document.getElementById('reportId').value;
    const customerName = document.getElementById('editCustomerName').value;
    const machineNumber = document.getElementById('editMachineNumber').value;
    const machineModel = document.getElementById('editMachineModel').value;
    const bwCounter = document.getElementById('editBWCounter').value;
    const colorCounter = document.getElementById('editColorCounter').value;
    const colorCounter2 = document.getElementById('editColorCounter2').value;
    const partNumber = document.getElementById('editPartNumber').value;
    const quantity = document.getElementById('editQuantity').value;
    const repairContent = document.getElementById('editRepairContent').value;

    fetch('/edit_report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            report_id: reportId,
            customer_name: customerName,
            machine_number: machineNumber,
            machine_model: machineModel,
            bw_counter: bwCounter,
            color_counter: colorCounter,
            color_counter2: colorCounter2,
            part_number: partNumber,
            quantity: quantity,
            repair_content: repairContent,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('報表已更新');
            location.reload();
        } else {
            alert('更新失敗');
        }
    });
}

function queryFetchClientNames() {
    fetch('/api/get_queryreportclient_names')
        .then(response => response.json())
        .then(data => {
            const dataList = document.getElementById('customerNameList');
            dataList.innerHTML = '';
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
        return Promise.resolve();  // 确保返回一个 Promise
}



// 管理者頁面報表查詢在页面加载时，设置结束日期为当前日期，并监听区域选择的变化
const areaQueryForm = document.getElementById('areaQueryForm');

if (areaQueryForm) {
    // 获取今天的日期
const today = new Date();

// 计算昨天的日期
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

// 格式化日期为 YYYY-MM-DD
const queryYesterday = yesterday.toISOString().split('T')[0];
const queryToday = today.toISOString().split('T')[0];

// 设置表单中的日期
document.getElementById('startDate').value = queryYesterday;
document.getElementById('endDate').value = queryToday;

    // 监听区域选择变化
    document.getElementById('queryAreaType').addEventListener('change', function() {
        const queryAreaType = document.getElementById('queryAreaType').value;
        queryAreaFetchClientNames(queryAreaType);
    });
}
// 获取并填充客户名称列表
function queryAreaFetchClientNames(queryAreaType) {
    fetch('/api/get_area_client_names', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queryAreaType: queryAreaType })
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