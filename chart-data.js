'use strict';
// Trenline


$(document).ready(function () {
  // Fetch data from Apps Script
  google.script.run.withSuccessHandler(function (data) {
    console.log("Received data:", data); // Log data for debugging
    createTrendlineChart(data); // Pass data to the chart function
  }).getPayrollExpensesVsRevenueData();
});

function roundData(data) {
  return data.map(item => Math.round(item));
}

function createTrendlineChart(data) {
  if (!data || !data.months || !data.revenues || !data.payrollExpenses || !data.employeeCounts) {
    console.error("Invalid data structure:", data);
    return;
  }

  // Round all the data values to make them cleaner and more readable
  data.revenues = roundData(data.revenues);
  data.payrollExpenses = roundData(data.payrollExpenses);
  data.totalGrossEarnings = roundData(data.totalGrossEarnings);
  data.totalPayrollExpensesIncludingB56 = roundData(data.totalPayrollExpensesIncludingB56);
  data.employeeCounts = roundData(data.employeeCounts);

  // Define the series based on the rounded data
  var options = {
    chart: {
      type: 'line',
      height: '500px',
      width: '100%',
    },
    series: [
      {
        name: 'Revenue',
        data: data.revenues, // Revenue for each month
        yAxis: 4, // Use the first y-axis
      },
      {
        name: 'Non Payroll Expenses',
        data: data.payrollExpenses, // Non Payroll Expenses for each month
        yAxis: 3, // Use the second y-axis
      },
      {
        name: 'Total Gross Earnings',
        data: data.totalGrossEarnings, // Total Gross Earnings for each month
        yAxis: 2, // Use the third y-axis
      },
      {
        name: 'Total Payroll Expenses (incl. B56)',
        data: data.totalPayrollExpensesIncludingB56, // Total Payroll Expenses including B56 for each month
        yAxis: 1, // Use the fourth y-axis
      },
      {
        name: 'Employee Count',
        data: data.employeeCounts, // Employee counts for each month
        yAxis: 0, // Use the fifth y-axis
      },
    ],
    xaxis: {
      categories: data.months, // Months as x-axis categories
      title: {
        text: 'Months',
      },
    },
    yaxis: [
      {
        labels: {
          show: false, // Hide this y-axis labels
        },
        opposite: false,
      },
      {
        labels: {
          show: false, // Hide this y-axis labels
        },
        opposite: true, // Place on the right side
      },
      {
        labels: {
          show: false, // Hide this y-axis labels
        },
        opposite: false,
      },
      {
        labels: {
          show: false, // Hide this y-axis labels
        },
        opposite: true, // Place on the right side
      },
      {
        labels: {
          show: false, // Hide this y-axis labels
        },
        opposite: false,
      },
    ],
    title: {
      text: 'Trendline of Current Financial Year',
      align: 'center',
    },
    legend: {
      position: 'bottom',
      itemMargin: { horizontal: 5, vertical: 5 }, // Add some margin between legend items
    },
    tooltip: {
      shared: true, // Show all series in the tooltip
      intersect: false,
    },
    stroke: {
      curve: 'smooth', // Make the trendlines smooth
    },
    markers: {
      size: 4, // Adjust the marker size to make it more visible
    },
    grid: {
      borderColor: '#f1f1f1',
    },
  };

  // Render the chart
  var chart = new ApexCharts(document.querySelector("#trendline-chart"), options);
  chart.render();
}


// Bar Chart Workforce Percentage

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

// Bar Chart for Employee Count

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

      // Trend line data array (This is where we calculate the trend line)
      let trendData = [];

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
          trendData.push(monthData.reduce((a, b) => a + b, 0) / monthData.length); // Average for trend line
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
        trendData = data; // Use data as trend line for single department
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
        trendData = data; // Use data as trend line for single month
      }

      // Add a line series for the trend line
      seriesData.push({
        name: 'Trend Line',
        type: "line",
        data: trendData,
        color: '#FF6347', // Red color for the trend line
        dataLabels: { enabled: false },
        stroke: { width: 2, curve: 'smooth' }
      });

      const chartConfig = {
        series: seriesData,
        chart: {
          type: "line",
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

// Bar Chart of Gross Earnings




$(document).ready(function () {
  google.script.run.withSuccessHandler(function (data) {
    console.log("Received data:", data);

    var months = data.months;
    var expenseData = data.expenses;

    if (months.length > 0) {
      // Populate the month dropdown with formatted months
      months.forEach(function (month) {
        $('#monthSelector1').append(new Option(month, month)); // Use month as both value and text
      });

      // Set the default selection to the last month
      var selectedMonth = months[months.length - 1];
      $('#monthSelector1').val(selectedMonth);

      // Display expenses for the default selected month
      displayExpenses(expenseData, selectedMonth);
    } else {
      console.error("No months available to display.");
    }

    // Change event for updating the table when a new month is selected
    $('#monthSelector1').change(function () {
      var selectedMonth = $(this).val();
      displayExpenses(expenseData, selectedMonth);
    });
  }).getMonthlyExpenseData(); // Call the Apps Script function
});

      // Function to display expenses in a table format
      function displayExpenses(expenseData, selectedMonth) {
        var expenses = expenseData[selectedMonth];
        if (!expenses) {
          console.error("No data available for the selected month:", selectedMonth);
          return;
        }

        // Update the table heading
        $('#selectedMonth').text(`Expense Details for ${selectedMonth}`);

        // Populate the table
        var tableBody = $('#expenseTable tbody');
        tableBody.empty(); // Clear existing data

        for (var label in expenses) {
          var value = expenses[label];
          tableBody.append(`
            <tr>
              <td>${label}</td>
              <td>${value}</td>
            </tr>
          `);
        }
      }

// Pie Chart for Payroll Expenses vs Revenue

$(document).ready(function () {
  var chart; // Declare chart variable globally to manage the chart instance

  // Fetch the data from Google Apps Script (adjust the script function call as needed)
  google.script.run.withSuccessHandler(function (data) {
    console.log("Received data:", data); // Check the received data

    var months = data.months;
    var revenues = data.revenues;
    var totalPayrollExpensesIncludingB56 = data.totalPayrollExpensesIncludingB56; // Use this field
    var employeeCounts = data.employeeCounts; // Employee counts per month

    // Optionally populate the month selector dropdown
    if (months.length > 0) {
      months.forEach(function (month) {
        $('#monthSelector3').append(new Option(month, month));
      });

      // Default to the last month in the list
      var lastMonth = months[months.length - 1];
      $('#monthSelector3').val(lastMonth);

      // Initialize the header and chart with the last month's data
      var lastIndex = months.length - 1;
      updateHeader(employeeCounts[lastIndex], totalPayrollExpensesIncludingB56[lastIndex]);
      renderPieChart(totalPayrollExpensesIncludingB56[lastIndex], revenues[lastIndex]);
    }

    // Function to update the header with total employee count, total payroll expenses, and cost per employee
    function updateHeader(employeeCount, totalPayrollExpensesIncludingB56) {
      employeeCount = employeeCount || 0;
      totalPayrollExpensesIncludingB56 = totalPayrollExpensesIncludingB56 || 0;

      // Calculate cost per employee
      var costPerEmployee = employeeCount > 0 
        ? (totalPayrollExpensesIncludingB56 / employeeCount).toFixed(2)
        : 0;

      // Update the header
      $('#header').html(`
        <p style="font-size:14px; padding-top:10px; font-weight:bold;">Total Employee Count: ${employeeCount} I   Total Payroll Expenses: ${totalPayrollExpensesIncludingB56.toLocaleString()}</p>
        <p style="font-size:14px; padding-bottom:10px; font-weight:bold;">Cost Per Employee: ${costPerEmployee}</p>
      `);
    }

    // Function to render the pie chart
    function renderPieChart(payrollExpensesIncludingB56, revenueData) {
      // Validate and ensure data integrity
      payrollExpensesIncludingB56 = payrollExpensesIncludingB56 || 0;
      revenueData = revenueData || 1; // Prevent division by zero

      if (isNaN(payrollExpensesIncludingB56) || isNaN(revenueData)) {
        console.error("Invalid data for chart rendering:", { payrollExpensesIncludingB56, revenueData });
        return; // Abort rendering
      }

      // Calculate percentage
      var payrollPercentage = ((payrollExpensesIncludingB56 / revenueData) * 100).toFixed(2);
      var remainingPercentage = (100 - payrollPercentage).toFixed(2);

      // Destroy the previous chart if it exists
      if (chart) {
        chart.destroy();
      }

      // Render the chart
      var options = {
        series: [parseFloat(payrollPercentage), parseFloat(remainingPercentage)],
        chart: {
          type: 'pie',
          height: 400
        },
        labels: ['Payroll Expenses INon Payroll (%)', 'Remaining Revenue (%)'],
        colors: ['#7638ff', '#ff737b'], // Custom colors for the slices
        title: {
          text: 'Payroll Expenses Including No Payroll as % of Revenue',
          align: 'center'
        },
        legend: {
          position: 'bottom', // Position the legend at the bottom
          labels: {
            colors: '#333', // Optional: Customize legend label colors
          },
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: '100%'
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      };

      chart = new ApexCharts(document.querySelector("#exp-chart"), options);
      chart.render();
    }

    // Optional: Update the chart and header when the month is changed from the dropdown
    $('#monthSelector3').change(function () {
      var selectedMonth = $(this).val();
      var index = months.indexOf(selectedMonth);
      if (index > -1) {
        var revenueData = revenues[index];
        var payrollData = totalPayrollExpensesIncludingB56[index];
        var employeeCount = employeeCounts[index];
        updateHeader(employeeCount, payrollData); // Update the header
        renderPieChart(payrollData, revenueData); // Update the chart
      }
    });

  }).getPayrollExpensesVsRevenueData(); // Call the Apps Script function to fetch data
});

