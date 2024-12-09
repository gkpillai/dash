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
            columnWidth: "50%",
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

  if (selectedDepartment === "all" && selectedMonth === "all") {
    // Case: All departments and all months
    categories = allDepartments;

    allMonths.forEach((month) => {
      const monthData = [];
      allDepartments.forEach((department) => {
        const departmentData = response.find((item) => item.department === department);
        const monthIndex = departmentData.months.indexOf(month);
        monthData.push(departmentData.earnings[monthIndex] || 0);
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
    categories = allMonths; // Fix: Set categories to allMonths

    const departmentData = response.find((item) => item.department === selectedDepartment);
    const data = allMonths.map((month) => {
      const monthIndex = departmentData.months.indexOf(month);
      return departmentData.earnings[monthIndex] || 0;
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
      return departmentData.earnings[monthIndex] || 0;
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
        columnWidth: "50%",
      },
    },
    dataLabels: {
      enabled: false,
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
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return  Math.round(val); // Round the tooltip value
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
