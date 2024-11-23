document.addEventListener('DOMContentLoaded', function() {
    const customerListModal = document.getElementById('customerListModal');
    const modifyClientTable = document.getElementById('modifyClientTable');
    if (customerListModal) {
        customerListModal.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/initweb/modifyclient';

        });
    }
    if (modifyClientTable) {
    fetchCustomerList();
        };
    function fetchCustomerList() {
        showLoadingIndicator(); // 显示加载指示器
        fetchWithTimeout('/api/get_customer_list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // 返回 JSON 数据
        })
        .then(data => {
            if (data.error) {
                showErrorModal(data.error);
            } else {
                populateCustomerTable(data);
            }
        })
        .catch(error => {
            console.error('Error fetching customer list:', error);
            showErrorModal('無法獲取客戶列表');
        })
        .finally(() => {
            hideLoadingIndicator(); // 隐藏加载指示器
        });
    }
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            searchCustomers(query);
        });
    }
    
    function searchCustomers(query) {
        showLoadingIndicator(); // 显示加载指示器
        fetchWithTimeout('/api/search_customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // 返回 JSON 数据
        })
        .then(data => {
            if (data.error) {
                showErrorModal(data.error);
            } else {
                populateCustomerTable(data);
            }
        })
        .catch(error => {
            console.error('Error searching customers:', error);
            showErrorModal('無法搜尋客戶');
        })
        .finally(() => {
            hideLoadingIndicator(); // 隐藏加载指示器
        });
    }


    function populateCustomerTable(data) {
        const tableBody = document.querySelector('#modifyClientTable tbody');
        tableBody.innerHTML = ''; // 清空表格
        data.forEach((client, index) => {

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${client[0] || ''}</td>
                <td>${client[1] || ''}</td>
                <td>${client[2] || ''}</td>
                <td>${client[3] || ''}</td>
                <td>${client[4] || ''}</td>
                <td>${client[5] || ''}</td>
                <td>${client[6] || ''}</td>
                <td>
                    <button class="btn btn-info report-btn" data-customer-name='${client[1]}'>查詢</button>
                    <button class="btn btn-primary edit-btn" data-customer='${JSON.stringify(client)}'>編輯</button>
                    <button class="btn btn-danger delete-btn" data-customer-id='${client[0]}'>刪除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function () {
                const customer = JSON.parse(this.getAttribute('data-customer'));
                document.getElementById('editCustomerName').value = customer[1];
                document.getElementById('editCustomerMachineNumber').value = customer[2] || '';
                document.getElementById('editCustomerModel').value = customer[3] || '';
                document.getElementById('editCustomer').value = customer[4] || '';
                document.getElementById('editCustomerType').value = customer[5] || '';
                document.getElementById('editCustomerIp').value = customer[6] || '';
                showModal('editCustomerModal');
                document.getElementById('saveEditCustomerButton').onclick = function () {
                    saveEditCustomer(customer[0]);
                };
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
                const customerId = JSON.parse(this.getAttribute('data-customer-id'));
        
                // 弹出确认对话框
              
                modalDialog('您確定要刪除這個客戶嗎？').then((confirmed) => {
                if (confirmed) {
                    // 如果用户确认，执行删除操作
                    deleteCustomer(customerId);
                } else {
                    // 如果用户取消，不执行任何操作
                    console.log('刪除操作已取消');
                }
            });
            });
        });
        

        document.querySelectorAll('.report-btn').forEach(button => {
            button.addEventListener('click', function () {
                const customerName = this.getAttribute('data-customer-name');
                openCustomerReportPage(customerName);
            });
        });
    }

    function openCustomerReportPage(customerName) {
        // 将客户名称传递到新的页面 URL
        const reportPageUrl = `/report_page?customer_name=${encodeURIComponent(customerName)}`;
        window.open(reportPageUrl, '_blank');
    }
    
    

    function saveEditCustomer(id) {
        const newCustomerName = document.getElementById('editCustomerName').value || null;
        const newMachineNumber = document.getElementById('editCustomerMachineNumber').value || null;
        const newCustomerModel = document.getElementById('editCustomerModel').value || null;
        const newCustomer = document.getElementById('editCustomer').value || null;
        const newCustomerType = document.getElementById('editCustomerType').value || null;
        const newCustomerIp = document.getElementById('editCustomerIp').value || null;

        fetch('/api/edit_customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                new_customer_name: newCustomerName,
                new_machine_number: newMachineNumber,
                new_Customer_Model: newCustomerModel,
                new_Customer: newCustomer,
                new_Customer_Type: newCustomerType,
                new_Customer_Ip: newCustomerIp
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                closeModal('editCustomerModal');
                showErrorModal(data.error);
            }   else {
                closeModal('editCustomerModal');
                  showSuccessModal(data.success).then(() => {
      
                  fetchCustomerList();
               });
              }
          })
          .catch(error => {
              console.error('Error editing customer:', error);
              closeModal('editCustomerModal');
              showErrorModal('無法編輯客戶資料');
          });
      }
  
      function deleteCustomer(id) {
          fetch('/api/delete_customer', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ id:id })
          })
          .then(response => response.json())
          .then(data => {
              if (data.error) {
                  showErrorModal(data.error);
              } else {
                  showSuccessModal(data.success).then(() => {
      
                  fetchCustomerList();
                 });
              }
          })
          .catch(error => {
              console.error('Error deleting customer:', error);
              closeModal('editCustomerModal');
              showErrorModal('無法刪除客戶資料');
          });
      }

    function showModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    function closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }


});


document.addEventListener('DOMContentLoaded', function() {
    const allModifyClientTable = document.getElementById('allModifyClientTable');
    if(allModifyClientTable){
    // 初始化时默认加载第一个区域的客户
    allfetchCustomerList('全區');
    }
    const areaTabs = document.getElementById('areaTabs');

    if (areaTabs) {
        areaTabs.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const area = e.target.getAttribute('data-area');
                
                // 切换激活状态
                document.querySelectorAll('#areaTabs .nav-link').forEach(tab => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');

                // 根据选择的区域加载客户列表
                allfetchCustomerList(area);
            }
        });
    }




    function allfetchCustomerList(area) { // 默认加载“全區”客户
        showLoadingIndicator(); // 显示加载指示器
    
        // 确定要调用的 API 路径
        const apiUrl = area === '全區' ? '/api/get_allcustomer_list' : '/api/get_allcustomer_list_by_area';
    
        // 发送请求获取客户列表
        fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(area === '全區' ? {} : { area }) // 若为"全區"不发送 body
        })
        .then(response => {
            return response.json(); // 返回 JSON 数据
        })
        .then(data => {
            if (data.error) {
                showErrorModal(data.error);
            } else {
                allpopulateCustomerTable(data,area); // 使用获取的数据填充表格
            }
        })
        .catch(error => {
            console.error('Error fetching customer list:', error);
            showErrorModal('無法獲取客戶列表');
        })
        .finally(() => {
            hideLoadingIndicator(); // 隐藏加载指示器
        });
    }
    
const allSearchInput = document.getElementById('allSearchInput');
if (allSearchInput) {
    allSearchInput.addEventListener('input', function() {
        const query = allSearchInput.value.trim().toLowerCase();
        filterTable(query);
    });
}


function filterTable(query) {
    const tableRows = document.querySelectorAll('#allModifyClientTable tbody tr');
    tableRows.forEach(row => {
        const clientNameCell = row.querySelector('td:nth-child(4)'); // 假設客戶名稱位於第4列
        
        if (clientNameCell && clientNameCell.textContent.toLowerCase().includes(query.toLowerCase())) {
            row.style.display = '';  // 顯示符合搜尋條件的行
        } else {
            row.style.display = 'none';  // 隱藏不符合條件的行
        }
    });
}

function allpopulateCustomerTable(data,area) {
    const tableBody = document.querySelector('#allModifyClientTable tbody');
    tableBody.innerHTML = ''; // 清空表格

    // 使用正确的键名 all_client_names
    if (!Array.isArray(data.allclient_names)) {
        console.error("all_client_names is not an array or is undefined", data);
        showErrorModal("無法顯示客戶列表：數據錯誤");
        return;
    }

    // 遍历客户数据并填充表格
    data.allclient_names.forEach((client, index) => {
        const row = document.createElement('tr');
        const userClass = data.user_class;

        let actionButtons = '';
        if (area === '全區' || userClass === '業務') {
            actionButtons = `<button class="btn btn-info report-btn" data-customer-name="${client[1]}" data-customer-area="${client[0]}">查詢</button>`;
        } else {
        if (userClass === '管理者'||area !== '全區') {
            actionButtons = `
                <button class="btn btn-info report-btn" data-customer-name='${client[1]}' data-customer-area='${client[0]}'>查詢</button>
                <button class="btn btn-primary edit-btn" data-customer='${JSON.stringify(client)}'>編輯</button>
                <button class="btn btn-danger delete-btn" data-customer-id='${client[7]}' data-customer-area='${client[0]}'>刪除</button>
            `;
        } else {
            actionButtons = `<button class="btn btn-info report-btn" data-customer-name='${client[1]}' data-customer-area='${client[0]}'>查詢</button>`;
        }
    }
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${client[7] || ''}</td>
            <td>${client[0] || ''}</td>
            <td>${client[1] || ''}</td>
            <td>${client[2] || ''}</td>
            <td>${client[3] || ''}</td>
            <td>${client[4] || ''}</td>
            <td>${client[5] || ''}</td>
            <td>${client[6] || ''}</td>
            <td>${actionButtons}</td>
        `;
        tableBody.appendChild(row);
    });

    if (data.user_class === '管理者') {
        bindButtonEvents();
    } else {
        salesButtonEvents();
    }
}


function bindButtonEvents() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const customer = JSON.parse(this.getAttribute('data-customer'));
            document.getElementById('allEditCustomerName').value = customer[1];
            document.getElementById('allEditCustomerMachineNumber').value = customer[2] || '';
            document.getElementById('allEditCustomerModel').value = customer[3] || '';
            document.getElementById('allEditCustomer').value = customer[4] || '';
            document.getElementById('allEditCustomerType').value = customer[5] || '';
            document.getElementById('allEditCustomerIp').value = customer[6] || '';
            showModal('allEditCustomerModal');
            document.getElementById('allSaveEditCustomerButton').onclick = function () {
                saveEditCustomer(customer[0], customer[7]);
            };
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const customerId = this.getAttribute('data-customer-id');
            const area = this.getAttribute('data-customer-area');
            // 弹出确认对话框
              
            modalDialog('您確定要刪除這個客戶嗎？').then((confirmed) => {
                if (confirmed) {
                    // 如果用户确认，执行删除操作
                    deleteCustomer(customerId,area);
                } else {
                    // 如果用户取消，不执行任何操作
                    console.log('刪除操作已取消');
                }
            });
        });
    });

    document.querySelectorAll('.report-btn').forEach(button => {
        button.addEventListener('click', function () {
            const customerName = this.getAttribute('data-customer-name');
            const area = this.getAttribute('data-customer-area');
            openAllCustomerReportPage(customerName, area);
        });
    });
}
function salesButtonEvents(){
    document.querySelectorAll('.report-btn').forEach(button => {
        button.addEventListener('click', function () {
            const customerName = this.getAttribute('data-customer-name');
            const area = this.getAttribute('data-customer-area');
            openAllCustomerReportPage(customerName, area);
        });
    });
}

function openAllCustomerReportPage(customerName,area) {
    // 将客户名称传递到新的页面 URL
    const allReportPageUrl = `/allreport_page?customer_name=${encodeURIComponent(customerName)}&area=${encodeURIComponent(area)}`;
    window.open(allReportPageUrl, '_blank');
}



function saveEditCustomer(area,id) {

    const newCustomerName = document.getElementById('allEditCustomerName').value || null;
    const newMachineNumber = document.getElementById('allEditCustomerMachineNumber').value || null;
    const newCustomerModel = document.getElementById('allEditCustomerModel').value || null;
    const newCustomer = document.getElementById('allEditCustomer').value || null;
    const newCustomerType = document.getElementById('allEditCustomerType').value || null;
    const newCustomerIp = document.getElementById('allEditCustomerIp').value || null;

    fetch('/api/edit_allcustomer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            area: area,
            id: id,
            new_customer_name: newCustomerName,
            new_machine_number: newMachineNumber,
            new_Customer_Model: newCustomerModel,
            new_Customer: newCustomer,
            new_Customer_Type: newCustomerType,
            new_Customer_Ip: newCustomerIp,

        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            closeModal('allEditCustomerModal');
            showErrorModal(data.error);
        } else {
            closeModal('allEditCustomerModal');
            showSuccessModal(data.success).then(() =>{
                 

                allfetchCustomerList(area);

        });
        }
    })
    .catch(error => {
        console.error('Error editing customer:', error);
        closeModal('allEditCustomerModal');
        showErrorModal('無法編輯客戶資料');
    });
}

function deleteCustomer(id,area) {
    fetch('/api/delete_allcustomer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id:id , area:area})
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showErrorModal(data.error);
        } else {
            showSuccessModal(data.success).then(() =>{
            
            allfetchCustomerList(area);
        });
        }
    })
    .catch(error => {
        console.error('Error deleting customer:', error);
        closeModal('editCustomerModal');
        showErrorModal('無法刪除客戶資料');
    });
}

function showModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
}
});