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
        fetch('/modal/success_modal.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('modalPlaceholder3').innerHTML = html;
                document.getElementById('successModalMessage').innerText = message;
                var successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
            })
            .catch(err => console.error('讀取success_modal錯誤:', err));
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
