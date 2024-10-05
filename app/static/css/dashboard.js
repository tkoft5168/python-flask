document.addEventListener('DOMContentLoaded', function () {
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


