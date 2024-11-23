       // 显示错误模态框的函数
    function showErrorModal(message) {
        fetch('/modal/err_modal.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('modalPlaceholder3').innerHTML = html;
                document.getElementById('errorModalMessage').innerText = message;
                var errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
                errorModal.show();
            })
            .catch(err => console.error('讀取err_modal錯誤:', err));
    }

    function showSuccessModal(message) {
        return new Promise((resolve, reject) => {
            fetch('/modal/success_modal.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    document.getElementById('modalPlaceholder3').innerHTML = html;
                    document.getElementById('successModalMessage').innerText = message;
                    var successModal = new bootstrap.Modal(document.getElementById('successModal'));
    
                    // 监听模态框关闭事件，确保在关闭时执行后续操作
                    document.getElementById('successModal').addEventListener('hidden.bs.modal', function () {
                        resolve();  // 在模态框关闭时，resolve Promise
                    });
    
                    successModal.show();  // 显示模态框
                })
                .catch(err => {
                    console.error('讀取success_modal錯誤:', err);
                    reject(err);  // 如果有错误，拒绝 Promise
                });
        });
    }

    function modalDialog(message) {
        return new Promise((resolve) => {
            fetch('/modal/modal-dialog.html')
                .then(response => response.text())
                .then(html => {
                    document.getElementById('modalPlaceholder3').innerHTML = html;
                    document.getElementById('modalDialogLabelMessage').innerText = message;
                    var modalDialog = new bootstrap.Modal(document.getElementById('modalDialog'));
                    modalDialog.show();
    
                    // 绑定确定和取消按钮的事件
                    document.getElementById('modalDialogConfirmButton').addEventListener('click', () => {
                        modalDialog.hide();
                        resolve(true);
                    });
    
                    document.getElementById('modalDialogCancelButton').addEventListener('click', () => {
                        modalDialog.hide();
                        resolve(false);
                    });
                })
            .catch(err => console.error('讀取modal-dialog.html錯誤:', err)); // 捕获和处理错误
        });
    }
function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

// 封装 fetch 请求，支持超时
function fetchWithTimeout(url, options, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const abortController = new AbortController();
        const { signal } = abortController;

        const fetchPromise = fetch(url, { ...options, signal })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(resolve)
            .catch(reject);

        const timeoutId = setTimeout(() => {
            abortController.abort();
            reject(new Error('请求超时'));
        }, timeout);

        fetchPromise.finally(() => clearTimeout(timeoutId));
    });
}


//請稍候的程式
function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function fetchWithTimeout(url, options, timeout = 60000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('請求超時')), timeout)
        )
    ]);
}