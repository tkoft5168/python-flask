document.addEventListener('DOMContentLoaded', function() {
    const addClientModal = document.getElementById('addClientModal');
    const addClientForm = document.getElementById('addClientForm');

    if (addClientModal) {
        addClientModal.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/initweb/addclient';
        });
    }

    if (addClientForm) {
        addClientForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = {
                client_name: document.getElementById('clientName').value,
                machine_number: document.getElementById('machineNumber').value,
                machine_model: document.getElementById('machineModel').value,  
                ip_address: document.getElementById('ipAddress').value
            };

            // 先检查客户是否已经存在
            fetch(`/api/check_client_exists?client_name=${encodeURIComponent(formData.client_name)}`)
            .then(response => response.json())
            .then(data => {
                if (data.client_exists) {
                    // 客户已存在，显示错误消息
                    showErrorModal(`客户 ${formData.client_name} 已经存在！`);
                } else {
                    // 客户不存在，继续提交表单
                    fetch('/api/add_client', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            showErrorModal(data.error);
                        } else {
                            showSuccessModal(`客户 ${formData.client_name} 已新增！`);
                            
                            // 重置表单
                            addClientForm.reset();
                            
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});
}
});