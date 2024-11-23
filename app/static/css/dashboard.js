document.addEventListener('DOMContentLoaded', function () {

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
    const monthForm = document.getElementById('monthForm');
    if (monthForm){
    const labels = [];
    const totalClients = [];
    const matchedClients = [];

    const rows = document.querySelectorAll('#statsTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        labels.push(cells[0].textContent); // 区域名称
        totalClients.push(parseInt(cells[1].textContent)); // 总客户数
        matchedClients.push(parseInt(cells[2].textContent)); // 客户保养达成数
    });

    // Initialize Chart
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: '總客戶數',
                data: totalClients,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: '客戶保養達成數',
                data: matchedClients,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };

    // Create Chart
    const ctx = document.getElementById('myChart').getContext('2d');
    
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
});


document.getElementById('logoutLink').addEventListener('click', function(event) {
          event.preventDefault();
          
          fetch('/logout', {
              method: 'POST',
              headers: {
            'Content-Type': 'application/json',
            
        }
          })
          .then(response => {
              if (response.ok) {
                  window.location.href = '/'; // 假设登录页面的路径是 /
              } else {
                  console.error('登出失敗');
              }
          })
          .catch(error => {
              console.error('登出時發生錯誤:', error);
          });
      });


