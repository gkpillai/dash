'use strict';
$(document).ready(function () {
  google.script.run.withSuccessHandler(function (response) {
    // Define the chronological order for months
    const monthOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Sort months in chronological order
    const sortedMonths = Object.keys(response).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      return (
        parseInt(yearA) - parseInt(yearB) || 
        monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB)
      );
    });

    const allDepartments = new Set(); // To hold unique department names
    const monthData = {}; // Store data for each month

    // Collect department names and organize data
    sortedMonths.forEach((month) => {
      monthData[month] = [];
      response[month].forEach((item) => {
        allDepartments.add(item.department); // Add department to the set
        monthData[month].push({
          department: item.department,
          percentage: parseFloat(item.percentage), // Convert percentage to float
        });
      });
    });

    const departments = Array.from(allDepartments); // Convert set to array
    let currentChart; // Hold the chart instance for updates

    // Create dropdowns for department and month selection
    const departmentDropdown = $('<select id="department-select" class="dropdown">').append('<option value="all">All Departments</option>');
    departments.forEach((department) => {
      departmentDropdown.append(`<option value="${department}">${department}</option>`);
    });

    const monthDropdown = $('<select id="month-select" class="dropdown">').append('<option value="all">All Months</option>');
    sortedMonths.forEach((month) => {
      monthDropdown.append(`<option value="${month}">${month}</option>`);
    });

  // Clear any existing content in the controls container
$('#controls').empty();

// Append dropdowns to controls container
$('#controls')
  .append('<div class="dropdown-container"><label for="department-select">Department:</label><select id="department-select" class="dropdown"><option value="all">All Departments</option></select></div>')
  .append('<div class="dropdown-container"><label for="month-select">Month:</label><select id="month-select" class="dropdown"><option value="all">All Months</option></select></div>');

// Append options for department and month
departments.forEach(department => {
  $('#department-select').append(`<option value="${department}">${department}</option>`);
});

sortedMonths.forEach(month => {
  $('#month-select').append(`<option value="${month}">${month}</option>`);
});


    // Function to render the chart
    const renderChart = (selectedDepartment, selectedMonth) => {
      let seriesData = [];
      let categories = [];

      if (selectedMonth === "all" && selectedDepartment !== "all") {
        // Case: All months for a specific department
        categories = sortedMonths; // Use months as x-axis labels

        const data = sortedMonths.map((month) => {
          const monthDataForDepartment = monthData[month].find(
            (item) => item.department === selectedDepartment
          );
          return monthDataForDepartment ? monthDataForDepartment.percentage : 0;
        });

        seriesData.push({
          name: selectedDepartment,
          type: "bar",
          data: data,
        });
      } else if (selectedMonth === "all") {
        // Case: All months and all departments
        categories = departments; // Use departments as x-axis labels

        sortedMonths.forEach((month) => {
          const data = departments.map((department) => {
            const deptData = monthData[month].find(
              (item) => item.department === department
            );
            return deptData ? deptData.percentage : 0;
          });

          seriesData.push({
            name: month,
            type: "bar",
            data: data,
          });
        });
      } else {
        // Case: Specific month
        categories = departments; // Use departments as x-axis labels

        const data = departments.map((department) => {
          const deptData = monthData[selectedMonth].find(
            (item) => item.department === department
          );
          return deptData ? deptData.percentage : 0;
        });

        seriesData.push({
          name: selectedMonth,
          type: "bar",
          data: data,
        });
      }

      // Chart configuration
      const chartConfig = {
        series: seriesData,
        chart: {
          type: "bar",
          height: 400,
          width: "100%",
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "80%",
            //endingShape: "rounded",
          },
        },
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          categories: categories, // Dynamically update x-axis labels
          labels: {
            rotate: -45,
            style: {
              fontSize: "10px",
              fontWeight: "normal",
              fontFamily: "Helvetica, Arial, sans-serif",
            },
          },
        },
        yaxis: {
          title: {
            text: "Work Percentage (%)",
          },
          max: 100,
          min: 0,
        },
        colors: ['#7638ff', '#ff737b', '#fda600', '#1ec1b0', '#8e44ad', '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e', '#1abc9c'],
        tooltip: {
          y: {
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      };

      // Destroy the previous chart if it exists
      if (currentChart) {
        currentChart.destroy();
      }

      // Render the new chart
      currentChart = new ApexCharts(document.querySelector("#chart"), chartConfig);
      currentChart.render();
    };

    // Render the default chart: All departments and months
    renderChart("all", "all");

    // Update the chart when the dropdown selection changes
    $("#department-select").change(function () {
      const selectedDepartment = $("#department-select").val();
      const selectedMonth = $("#month-select").val();

      // If a specific department is selected, reset the month dropdown to "All Months"
      if (selectedDepartment !== "all") {
        $("#month-select").val("all").trigger("change");
      }

      renderChart(selectedDepartment, selectedMonth);
    });

    $("#month-select").change(function () {
      const selectedMonth = $("#month-select").val();
      const selectedDepartment = $("#department-select").val();

      if (selectedMonth !== "all" && selectedDepartment !== "all") {
        // Reset the department dropdown to "All Departments"
        $("#department-select").val("all").trigger("change");
      }

      renderChart($("#department-select").val(), selectedMonth);
    });
  }).getChartData(); // Trigger the backend function
});



$(document).ready(function () {
  google.script.run.withSuccessHandler(function (response) {
    if (!response || response.length === 0) {
      console.error("No data received or empty response.");
      return;
    }

    const allDepartments = response.map(item => item.department);
    const allMonths = response[0].months;
    let currentChart;

    const monthColors = [
      '#7638ff', '#ff737b', '#fda600', '#1ec1b0', '#8e44ad', '#3498db', 
      '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e', '#1abc9c'
    ];

    const departmentDropdown = $('<select id="department2-select" class="dropdown">').append('<option value="all">All Departments</option>');
    allDepartments.forEach((department) => {
      departmentDropdown.append(`<option value="${department}">${department}</option>`);
    });

    const monthDropdown = $('<select id="month2-select" class="dropdown">').append('<option value="all">All Months</option>');
    allMonths.forEach((month) => {
      monthDropdown.append(`<option value="${month}">${month}</option>`);
    });

    $('#controls2').empty();
    $('#controls2')
      .append('<div class="dropdown-container"><label for="department2-select">Department:</label></div>')
      .append(departmentDropdown)
      .append('<div class="dropdown-container"><label for="month2-select">Month:</label></div>')
      .append(monthDropdown);

    const renderChart = (selectedDepartment, selectedMonth) => {
      let seriesData = [];
      let categories = [];
      let yAxisMax = 0;
      let totalEmployeeCount = 0;

      if (selectedDepartment === "all" && selectedMonth === "all") {
        categories = allDepartments;

        allMonths.forEach((month, index) => {
          const monthData = [];
          allDepartments.forEach((department) => {
            const departmentData = response.find(item => item.department === department);
            const monthIndex = departmentData.months.indexOf(month);
            monthData.push(departmentData.employeeCount[monthIndex] || 0);
          });

          seriesData.push({
            name: month,
            type: "bar",
            data: monthData,
            color: monthColors[index % monthColors.length],
            dataLabels: { enabled: false }
          });

          yAxisMax = Math.max(yAxisMax, ...monthData);
        });
      } else if (selectedMonth === "all") {
        categories = allMonths;

        const departmentData = response.find(item => item.department === selectedDepartment);
        const data = allMonths.map(month => {
          const monthIndex = departmentData.months.indexOf(month);
          return departmentData.employeeCount[monthIndex] || 0;
        });

        seriesData.push({
          name: selectedDepartment,
          type: "bar",
          data: data,
          color: '#33FF57',
          dataLabels: {
            enabled: true,
            formatter: function (val) {
              return val; // Show exact value above the bar
            },
            style: {
              fontSize: '12px',
              fontWeight: 'bold',
              colors: ['#000']
            },
            offsetY: -10
          }
        });

        yAxisMax = Math.max(...data);
      } else {
        categories = allDepartments;

        const data = allDepartments.map(department => {
          const departmentData = response.find(item => item.department === department);
          const monthIndex = departmentData.months.indexOf(selectedMonth);
          return departmentData.employeeCount[monthIndex] || 0;
        });

        seriesData.push({
          name: selectedMonth,
          type: "bar",
          data: data,
          color: monthColors[allMonths.indexOf(selectedMonth) % monthColors.length],
          dataLabels: {
            enabled: true,
            formatter: function (val) {
              return val; // Show exact value above the bar
            },
            style: {
              fontSize: '12px',
              fontWeight: 'bold',
              colors: ['#000']
            },
            offsetY: -10
          }
        });

        totalEmployeeCount = data.reduce((sum, value) => sum + value, 0);
        yAxisMax = Math.max(...data);
      }

      const chartConfig = {
        series: seriesData,
        chart: {
          type: "bar",
          height: 400,
          width: "100%"
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "70%"
          }
        },
        dataLabels: {
          enabled: false // Default to no labels unless specified in series
        },
        xaxis: {
          categories: categories,
          labels: {
            rotate: -90,
            style: {
              fontSize: "10px",
              fontWeight: "normal",
              fontFamily: "Helvetica, Arial, sans-serif"
            }
          }
        },
yaxis: {
  max: yAxisMax * 1.2, // Dynamically set the maximum value
  min: 0, // Start at 0
  tickAmount: 15, // Ensure intervals are evenly spaced and rounded
  labels: {
    formatter: function (value) {
      return Math.round(value); // Return whole numbers
    }
  }
},

        tooltip: {
          y: {
            formatter: function (val) {
              return val; // Show exact value in tooltip
            }
          }
        }
      };

      if (currentChart) {
        currentChart.destroy();
      }

      currentChart = new ApexCharts(document.querySelector("#count-chart"), chartConfig);
      currentChart.render();

      if (selectedMonth !== "all") {
        $('#total-employee-count').text(`Total Employees in ${selectedMonth}: ${totalEmployeeCount}`);
      } else {
        $('#total-employee-count').text('');
      }
    };

    renderChart("all", "all");

    $("#department2-select").change(function () {
      const selectedDepartment = $(this).val();
      const selectedMonth = $("#month2-select").val();
      if (selectedDepartment !== "all") {
        $("#month2-select").val("all");
      }
      renderChart(selectedDepartment, selectedMonth);
    });

    $("#month2-select").change(function () {
      const selectedMonth = $(this).val();
      const selectedDepartment = $("#department2-select").val();
      if (selectedMonth !== "all") {
        $("#department2-select").val("all");
      }
      renderChart(selectedDepartment, selectedMonth);
    });
  }).getEmployeeCountData();
});

