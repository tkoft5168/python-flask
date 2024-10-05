document.addEventListener('DOMContentLoaded', function() {
    const machineNumberTable = document.getElementById('machineNumberTable');

    if (machineNumberTable) {
        machineNumberList();
    }
});



function machineNumberList() {
    fetch('/api/get_machinenumber_list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showErrorModal(data.error);
        } else {
            populateMachineNumberTable(data);
        }
    })
    .catch(error => {
        console.error('Error fetching customer list:', error);
        showErrorModal('無法獲取機號列表');
    });

    const searchButton = document.getElementById('machineNumberSearchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = document.getElementById('machineNumberSearchInput').value.trim().toLowerCase();

            fetch('/api/search_machine_numbers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('搜尋失敗:', data.error);
                } else {
                    populateSearchButtonMachineNumberTable(data.results);
                    setupPagination(data.results.length);
                }
            })
            .catch(error => {
                console.error('Error fetching search results:', error);
            });
        });
    } else {
        console.error('Search button not found');
    }
}

function populateMachineNumberTable(data) {
    customerData = data; // 正确初始化全局 customerData
    displayPage(1); // 初始化顯示第一頁
    setupPagination();
}


let currentPage = 1;
const itemsPerPage = 100;
const maxPagesToShow = 5; // 一次最多顯示的頁數範圍
let customerData = []; // 用來存放客戶資料的數組
// 顯示指定頁面的資料
function displayPage(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const tableBody = document.querySelector('#machineNumberTable tbody');
    tableBody.innerHTML = ''; // 清空表格
    const pageData = customerData.slice(startIndex, endIndex); // 切割出當前頁的資料
    pageData.forEach((machine, index) => {
        const row = document.createElement('tr');
        row.innerHTML = 
        `
        <td>${index + 1}</td>
            <td>${machine[0] || ''}</td>
            <td>${machine[1] || ''}</td>
            <td>${machine[2] || ''}</td>
            <td>${machine[3] || ''}</td>
  

            <td>
                <button class="btn btn-primary edit-btn" data-machine='${JSON.stringify(machine)}'>編輯</button>
                <button class="btn btn-danger delete-btn" data-machinenumber='${JSON.stringify(machine[1])}'>刪除</button>
                
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const machine = JSON.parse(this.getAttribute('data-machine'));
            document.getElementById('machineNumberCustomer').value = machine[0];
            document.getElementById('machineNumber').value = machine[1] || '';
            document.getElementById('machineNumberModel').value = machine[2] || '';
            document.getElementById('machineNumberType').value = machine[3] || '';
            showModal('machineNumberModal');
            document.getElementById('SaveMachineNumberButton').onclick = function () {
                saveEditmachineNumber(machine[1]);
            };
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const machineNumber = JSON.parse(this.getAttribute('data-machinenumber'));
            deleteMachineNumber(machineNumber);
        });
    });
}
 // 設置分頁按鈕
function setupPagination() {
    const totalPages = Math.ceil(customerData.length / itemsPerPage); // 計算總頁數
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // 清空分頁按鈕

    // 顯示上一頁按鈕
    const prevButton = document.createElement('li');
    prevButton.classList.add('page-item');
    prevButton.innerHTML = '<a class="page-link" href="#">上一頁</a>';
    prevButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayPage(currentPage);
            setupPagination();
        }
    });
    pagination.appendChild(prevButton);

    // 計算頁碼顯示範圍
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // 如果當前頁前還有頁碼需要顯示，顯示省略號
    if (startPage > 1) {
        const firstPage = document.createElement('li');
        firstPage.classList.add('page-item');
        firstPage.innerHTML = '<a class="page-link" href="#">1</a>';
        firstPage.addEventListener('click', function() {
            currentPage = 1;
            displayPage(currentPage);
            setupPagination();
        });
        pagination.appendChild(firstPage);

        const dots = document.createElement('li');
        dots.classList.add('page-item');
        dots.innerHTML = '<span class="page-link">...</span>';
        pagination.appendChild(dots);
    }

    // 生成頁碼按鈕
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');
        if (i === currentPage) {
            pageItem.classList.add('active');
        }
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;

        pageItem.addEventListener('click', function() {
            currentPage = i;
            displayPage(currentPage);
            setupPagination();
        });
        pagination.appendChild(pageItem);
    }

    // 如果當前頁後還有頁碼需要顯示，顯示省略號
    if (endPage < totalPages) {
        const dots = document.createElement('li');
        dots.classList.add('page-item');
        dots.innerHTML = `<span class="page-link">...</span>`;
        pagination.appendChild(dots);

        const lastPage = document.createElement('li');
        lastPage.classList.add('page-item');
        lastPage.innerHTML = '<a class="page-link" href="#">' + totalPages + '</a>';
        lastPage.addEventListener('click', function() {
            currentPage = totalPages;
            displayPage(currentPage);
            setupPagination();
        });
        pagination.appendChild(lastPage);
    }

    // 顯示下一頁按鈕
    const nextButton = document.createElement('li');
    nextButton.classList.add('page-item');
    nextButton.innerHTML = '<a class="page-link" href="#">下一頁</a>';
    nextButton.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            displayPage(currentPage);
            setupPagination();
        }
    });
    pagination.appendChild(nextButton);
}


   




function saveEditmachineNumber(machinenumber) {
    const newMachineNumber = document.getElementById('machineNumber').value || null;
    const newMachineNumberModel = document.getElementById('machineNumberModel').value || null;
    const newCustomer = document.getElementById('machineNumberCustomer').value || null;
    const newMachineNumberType = document.getElementById('machineNumberType').value || null;

    fetch('/api/edit_machinenumber', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            machinenumber: machinenumber,
            newMachineNumber: newMachineNumber,
            newMachineNumberModel: newMachineNumberModel,
            newCustomer: newCustomer,
            newMachineNumberType: newMachineNumberType,

        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            closeModal('machineNumberModal');
            showErrorModal(data.error);
        } else {
            showSuccessModal(data.success);
            closeModal('machineNumberModal');
            machineNumberList();
        }
    })
    .catch(error => {
        console.error('Error editing customer:', error);
        closeModal('machineNumberModal');
        showErrorModal('無法編輯客戶資料');
    });
}

function deleteMachineNumber(machineNumber) {
    fetch('/api/delete_machinenumber', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ machineNumber: machineNumber})
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showErrorModal(data.error);
        } else {
            showSuccessModal(data.success);
           machineNumberList();
        }
    })
    .catch(error => {
        console.error('Error deleting customer:', error);
        closeModal('machineNumberModal');
        showErrorModal('無法刪除機號');
    });
}


const addMachineNumberButton = document.getElementById('addMachineNumberButton');
const saveNewMachineNumberButton = document.getElementById('saveNewMachineNumberButton');
const machineNumberTable = document.getElementById('machineNumberTable');

// 当点击新增机号按钮时，显示新增模态框
if (machineNumberTable) {
    addMachineNumberButton.addEventListener('click', function() {
        const brandSelect = document.getElementById('brandOptions');
        // 清空厂牌选单中的所有选项
        brandSelect.innerHTML = '<option value="" disabled selected>請選擇廠牌</option>';

        fetch('/api/get_brands')
            .then(response => response.json())
            .then(data => {
                // 选择要添加选项的下拉框
                const brandSelect = document.getElementById('brandOptions');  
                data.brands.forEach(brand => {
                    const option = document.createElement('option'); 
                    option.value = brand;
                    option.textContent = brand;
                    brandSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('無法獲取廠牌列表:', error);
            });
        
        const modal = new bootstrap.Modal(document.getElementById('addMachineNumberModal'));
        modal.show();
    });


// 當點擊保存按鈕時，將數據發送到後端
saveNewMachineNumberButton.addEventListener('click', function() {
    const machineNumberModel = document.getElementById('addMachineNumberModel').value;
    const startMachineNumber = document.getElementById('startMachineNumber').value;
    const endMachineNumber = document.getElementById('endMachineNumber').value;
    const machineNumberCustomer = document.getElementById('addMachineNumberCustomer').value;
    const machineNumberType = document.getElementById('addMachineNumberType').value;

    fetch('/api/add_machine_number', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            machine_number_model: machineNumberModel,
            start_machine_number: startMachineNumber,
            end_machine_number: endMachineNumber || null,  // 若未輸入結束機號則視為單個機號
            machine_number_customer: machineNumberCustomer,
            machine_number_type: machineNumberType
        })

    })
    
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal('addMachineNumberModal') 
            showSuccessModal('新增機號：' + data.inserted_machines + '\n已存在機號：' + data.skipped_machines);
            machineNumberList();  // 刷新頁面
            document.getElementById('addMachineNumberModel').value = '';
            document.getElementById('startMachineNumber').value = '';
            document.getElementById('endMachineNumber').value = '';
            document.getElementById('addMachineNumberCustomer').value = '';
            document.getElementById('addMachineNumberType').value = ''; // 重置選單至預設值
        } else {
            showErrorModal('新增機號錯誤');
        }
    })
    .catch(error => {
        console.error('新增機號錯誤:', error);
    });
    
});

    
function populateSearchButtonMachineNumberTable(query) {
    const tableBody = document.querySelector('#machineNumberTable tbody');
    tableBody.innerHTML = ''; // 清空当前表格内容

    if (query.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">未找到符合條件的資料</td></tr>';
        return;
    }

    query.forEach((machine, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${machine[0] || ''}</td>
            <td>${machine[1] || ''}</td>
            <td>${machine[2] || ''}</td>
            <td>${machine[3] || ''}</td>
            <td>
                <button class="btn btn-primary edit-btn" data-machine='${JSON.stringify(machine)}'>編輯</button>
                <button class="btn btn-danger delete-btn" data-machinenumber='${JSON.stringify(machine[1])}'>刪除</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // 重新绑定编辑和删除按钮的事件监听器
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const machine = JSON.parse(this.getAttribute('data-machine'));
            document.getElementById('machineNumberCustomer').value = machine[0];
            document.getElementById('machineNumber').value = machine[1] || '';
            document.getElementById('machineNumberModel').value = machine[2] || '';
            document.getElementById('machineNumberType').value = machine[3] || '';
            showModal('machineNumberModal');
            document.getElementById('SaveMachineNumberButton').onclick = function () {
                saveEditmachineNumber(machine[1]);
            };
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const machineNumber = JSON.parse(this.getAttribute('data-machinenumber'));
            deleteMachineNumber(machineNumber);
        });
    });
}


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