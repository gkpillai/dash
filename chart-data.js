'use strict';

$(document).ready(function() {

  var chart; // Declare chart globally

  google.script.run.withSuccessHandler(function(data) {
    console.log("Received data:", data); // Log received data
    
    // Check if the dropdown exists
    console.log($('#monthSelector')); // Log to ensure the dropdown is accessible

    // Populate the month dropdown
    if (data.months && data.months.length > 0) {
      data.months.forEach(function(month) {
        $('#monthSelector').append(new Option(month, month));
      });

      // Set the selected month to the last month in the data
      var selectedMonth = data.months[data.months.length - 1]; // Default to the last month
      $('#monthSelector').val(selectedMonth); // Set the dropdown value to the last month

      // Create the chart for the last month
      createChart(data, selectedMonth); // Create chart comparing Revenue vs Gross Earnings
    } else {
      console.error("No months available in data.");
    }

    // Event listener for dropdown change
    $('#monthSelector').change(function() {
      var selectedMonth = $(this).val(); // Get the selected month
      createChart(data, selectedMonth); // Recreate the chart with the new month data
    });

  }).getEarningsVsRevenueData(); // Fetch data from Apps Script
});

// Function to create the chart
function createChart(data, selectedMonth) {
  console.log("Creating chart for:", selectedMonth);

  // Destroy the old chart if it exists
  if (chart && chart.destroy) {
    chart.destroy();
  }

  var monthIndex = data.months.indexOf(selectedMonth);
  if (monthIndex === -1) return; // Return if month not found

  var earnings = data.earnings[monthIndex];
  var revenue = data.revenues[monthIndex]; // Get the revenue for the selected month

  var grossEarningsPercentage = 0; // Initialize grossEarningsPercentage
  var grossEarningsPerPaxNight = 0; // Initialize grossEarningsPerPaxNight

  if (revenue > 0) {
    grossEarningsPercentage = (earnings / revenue) * 100; // Calculate earnings as a percentage of revenue
  }

  var paxGuestNights = data.paxGuestNights[monthIndex];
  if (paxGuestNights > 0) {
    grossEarningsPerPaxNight = earnings / paxGuestNights; // Calculate gross earnings per Pax Guest Night
  }

  // Ensure both earnings and percentage are valid numbers
  if (isNaN(earnings) || isNaN(grossEarningsPercentage)) {
    console.error(`Invalid data for ${selectedMonth}: Earnings = ${earnings}, Gross Payroll Percentage = ${grossEarningsPercentage}`);
    return; // Exit if data is invalid
  }

  // Display the Gross Earnings per Pax Guest Night figure below the chart
  $('#paxGuestNightLabel').text(`Gross Payroll per Pax Guest Night: ${grossEarningsPerPaxNight.toFixed(2)}`);

  // Chart options for Donut chart
  var options = {
    chart: {
      type: 'donut', // Change to 'donut' for donut chart
      height: '400px', // Set fixed height for chart
      width: '100%', // Set width to 100% of the parent container
    },
    series: [grossEarningsPercentage, 100 - grossEarningsPercentage], // Data for the donut chart (percentage split)
    labels: [
      `${selectedMonth} Gross Payroll`, 
      `${selectedMonth} Remaining Revenue`
    ],
    title: {
      text: `Gross Payroll vs Revenue for ${selectedMonth}`,
      align: 'center', // Center the title
    },
    colors: [
      '#7638ff', '#ff737b', '#fda600', '#1ec1b0', '#8e44ad', 
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
      '#34495e', '#1abc9c'
    ], // Updated colors
    plotOptions: {
      pie: {
        donut: {
          size: '50%', // Make it a donut by setting size
        },
        legend: {
          position: 'bottom', // Set legend at the bottom of the chart
        }
      }
    },
    responsive: [
      {
        breakpoint: 1024, // Adjust the chart size for medium screens
        options: {
          chart: {
            width: '80%' // Make chart width smaller for medium screens
          }
        }
      },
      {
        breakpoint: 480, // Adjust the chart size for mobile screens
        options: {
          chart: {
            width: '100%' // Full-width for smaller screens
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ],
    legend: {
      position: 'bottom', // Set legend to bottom for all screen sizes
      offsetX: 0, // Adjust position horizontally if necessary
      offsetY: 0, // Adjust position vertically if necessary
      labels: {
        useSeriesColors: true // Ensure series colors are used in the legend
      }
    }
  };

  // Create and render the new chart
  chart = new ApexCharts(document.querySelector("#revenue-chart"), options);
  chart.render(); // Render the donut chart
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

// Bar Chart of Gross Earnings

$(document).ready(function () {
  // Call the server-side function to get the chart data
  google.script.run.withSuccessHandler(function (response) {
    if (!response || response.length === 0) {
      console.error("No data received or empty response.");
      return;
    }

    // response contains the chart data in the format { department, earnings, months }
    const allDepartments = response.map(item => item.department);
    const allMonths = response[0].months; // Assuming all departments have the same months
    let currentChart; // Hold the chart instance for updates

    // Create dropdowns for department and month selection
    const departmentDropdown = $('<select id="department1-select" class="dropdown">').append('<option value="all">All Departments</option>');
    allDepartments.forEach((department) => {
      departmentDropdown.append(`<option value="${department}">${department}</option>`);
    });

    const monthDropdown = $('<select id="month1-select" class="dropdown">').append('<option value="all">All Months</option>');
    allMonths.forEach((month) => {
      monthDropdown.append(`<option value="${month}">${month}</option>`);
    });

    // Clear any existing content in the controls container
    $('#controls1').empty();

    // Append dropdowns to controls container
    $('#controls1')
      .append('<div class="dropdown-container"><label for="department1-select">Department:</label></div>')
      .append(departmentDropdown)
      .append('<div class="dropdown-container"><label for="month1-select">Month:</label></div>')
      .append(monthDropdown);

    // Function to render the chart
 const renderChart = (selectedDepartment, selectedMonth) => {
  let seriesData = [];
  let categories = [];
  let yAxisMax = 0; // Variable to dynamically set the Y-axis maximum value
  let totalEarnings = 0; // To track total earnings for a specific month or department

  if (selectedDepartment === "all" && selectedMonth === "all") {
    // Case: All departments and all months
    categories = allDepartments;

    allMonths.forEach((month) => {
      const monthData = [];
      allDepartments.forEach((department) => {
        const departmentData = response.find((item) => item.department === department);
        const monthIndex = departmentData.months.indexOf(month);
        const earnings = departmentData.earnings[monthIndex] || 0;
        monthData.push(earnings);
        totalEarnings += earnings; // Add to total earnings
      });

      seriesData.push({
        name: month,
        type: "bar",
        data: monthData,
      });

      // Track the max earnings to set Y-axis limit
      const monthMax = Math.max(...monthData);
      yAxisMax = Math.max(yAxisMax, monthMax);
    });
  } else if (selectedMonth === "all") {
    // Case: All months for a specific department
    categories = allMonths; // Set categories to allMonths

    const departmentData = response.find((item) => item.department === selectedDepartment);
    const data = allMonths.map((month) => {
      const monthIndex = departmentData.months.indexOf(month);
      const earnings = departmentData.earnings[monthIndex] || 0;
      totalEarnings += earnings; // Add to total earnings
      return earnings;
    });

    seriesData.push({
      name: selectedDepartment,
      type: "bar",
      data: data,
    });

    // Track the max earnings to set Y-axis limit
    yAxisMax = Math.max(...data);
  } else {
    // Case: Specific department and specific month
    categories = allDepartments;

    const data = allDepartments.map((department) => {
      const departmentData = response.find((item) => item.department === department);
      const monthIndex = departmentData.months.indexOf(selectedMonth);
      const earnings = departmentData.earnings[monthIndex] || 0;
      totalEarnings += earnings; // Add to total earnings
      return earnings;
    });

    seriesData.push({
      name: selectedMonth,
      type: "bar",
      data: data,
    });

    // Track the max earnings to set Y-axis limit
    yAxisMax = Math.max(...data);
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
      },
    },
    dataLabels: {
      enabled: false, // Enable data labels to show earnings above bars
      formatter: function (val) {
        return Math.round(val); // Round the values for display
      },
      style: {
        fontSize: "12px",
        fontWeight: "bold",
        colors: ["#000"],
      },
      offsetY: -10, // Position the data labels above the bars
    },
    xaxis: {
      categories: categories,
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
        text: "Gross Earnings",
      },
      max: yAxisMax * 1.2, // Set Y-axis dynamically, a bit above the max earnings
      min: 0,
      labels: {
        formatter: function (value) {
          return Math.round(value); // Round the Y-axis values
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return Math.round(val); // Round the tooltip value
        },
      },
    },
  };

  // Destroy the previous chart if it exists
  if (currentChart) {
    currentChart.destroy();
  }

  // Render the new chart
  currentChart = new ApexCharts(document.querySelector("#pay-chart"), chartConfig);
  currentChart.render();

  // Show the total earnings above the chart
  if (selectedMonth !== "all") {
    $('#total-earnings').text(`Total Payroll in ${selectedMonth}: ${Math.round(totalEarnings)}`);
  } else {
    $('#total-earnings').text(`Total Payroll: ${Math.round(totalEarnings)}`);
  }
};

    // Render the default chart: All departments and all months (default behavior)
    renderChart("all", "all");

    // Update the chart when the department is changed
    $("#department1-select").change(function () {
      const selectedDepartment = $("#department1-select").val();
      const selectedMonth = $("#month1-select").val();

      if (selectedDepartment !== "all") {
        // Reset the month dropdown to "All Months" when a department is selected
        $("#month1-select").val("all");
      }

      // Render the chart based on the selected department and month
      renderChart(selectedDepartment, selectedMonth);
    });

    // Update the chart when the month is changed
    $("#month1-select").change(function () {
      const selectedMonth = $("#month1-select").val();
      const selectedDepartment = $("#department1-select").val();

      if (selectedMonth !== "all") {
        // Reset the department dropdown to "All Departments" when a month is selected
        $("#department1-select").val("all");
      }

      // Render the chart based on the selected department and month
      renderChart(selectedDepartment, selectedMonth);
    });

  }).getGrossEarningData(); // Trigger the backend function
});

// Pie Chart for Payroll vs Revenue

$(document).ready(function() {
  google.script.run.withSuccessHandler(function(data) {
    console.log("Received data:", data); // Log received data
    
    // Check if the dropdown exists
    console.log($('#monthSelector')); // Log to ensure the dropdown is accessible

    // Populate the month dropdown
    if (data.months && data.months.length > 0) {
      data.months.forEach(function(month) {
        $('#monthSelector').append(new Option(month, month));
      });

      // Set the selected month to the last month in the data
      var selectedMonth = data.months[data.months.length - 1]; // Default to the last month
      $('#monthSelector').val(selectedMonth); // Set the dropdown value to the last month

      // Create the chart for the last month
      createChart(data, selectedMonth); // Create chart comparing Revenue vs Gross Earnings
    } else {
      console.error("No months available in data.");
    }

    // Event listener for dropdown change
    $('#monthSelector').change(function() {
      var selectedMonth = $(this).val(); // Get the selected month
      createChart(data, selectedMonth); // Recreate the chart with the new month data
    });

  }).getEarningsVsRevenueData(); // Fetch data from Apps Script
});

// Function to create the chart
function createChart(data, selectedMonth) {
  console.log("Creating chart for:", selectedMonth);

  // Destroy the old chart if it exists
  if (chart && chart.destroy) {
    chart.destroy();
  }

  var monthIndex = data.months.indexOf(selectedMonth);
  if (monthIndex === -1) return; // Return if month not found

  var earnings = data.earnings[monthIndex];
  var revenue = data.revenues[monthIndex]; // Get the revenue for the selected month

  var grossEarningsPercentage = 0; // Initialize grossEarningsPercentage
  var grossEarningsPerPaxNight = 0; // Initialize grossEarningsPerPaxNight

  if (revenue > 0) {
    grossEarningsPercentage = (earnings / revenue) * 100; // Calculate earnings as a percentage of revenue
  }

  var paxGuestNights = data.paxGuestNights[monthIndex];
  if (paxGuestNights > 0) {
    grossEarningsPerPaxNight = earnings / paxGuestNights; // Calculate gross earnings per Pax Guest Night
  }

  // Ensure both earnings and percentage are valid numbers
  if (isNaN(earnings) || isNaN(grossEarningsPercentage)) {
    console.error(`Invalid data for ${selectedMonth}: Earnings = ${earnings}, Gross Payroll Percentage = ${grossEarningsPercentage}`);
    return; // Exit if data is invalid
  }

  // Display the Gross Earnings per Pax Guest Night figure below the chart
  $('#paxGuestNightLabel').text(`Gross Payroll per Pax Guest Night: ${grossEarningsPerPaxNight.toFixed(2)}`);

  // Chart options for Donut chart
  var options = {
    chart: {
      type: 'donut', // Change to 'donut' for donut chart
      height: '400px', // Set fixed height for chart
      width: '100%', // Set width to 100% of the parent container
    },
    series: [grossEarningsPercentage, 100 - grossEarningsPercentage], // Data for the donut chart (percentage split)
    labels: [
      `${selectedMonth} Gross Payroll`, 
      `${selectedMonth} Remaining Revenue`
    ],
    title: {
      text: `Gross Payroll vs Revenue for ${selectedMonth}`,
      align: 'center', // Center the title
    },
    colors: [
      '#7638ff', '#ff737b', '#fda600', '#1ec1b0', '#8e44ad', 
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
      '#34495e', '#1abc9c'
    ], // Updated colors
    plotOptions: {
      pie: {
        donut: {
          size: '50%', // Make it a donut by setting size
        },
        legend: {
          position: 'bottom', // Set legend at the bottom of the chart
        }
      }
    },
    responsive: [
      {
        breakpoint: 1024, // Adjust the chart size for medium screens
        options: {
          chart: {
            width: '80%' // Make chart width smaller for medium screens
          }
        }
      },
      {
        breakpoint: 480, // Adjust the chart size for mobile screens
        options: {
          chart: {
            width: '100%' // Full-width for smaller screens
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ],
    legend: {
      position: 'bottom', // Set legend to bottom for all screen sizes
      offsetX: 0, // Adjust position horizontally if necessary
      offsetY: 0, // Adjust position vertically if necessary
      labels: {
        useSeriesColors: true // Ensure series colors are used in the legend
      }
    }
  };

  // Create and render the new chart
  chart = new ApexCharts(document.querySelector("#revenue-chart"), options);
  chart.render(); // Render the donut chart
}

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


