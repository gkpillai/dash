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

// Append dropdowns to controls and initialize Select2
$('#controls')
  .append('<div class="dropdown-container"><label for="department-select">Department:</label></div>')
  .append('<div class="dropdown-container"><label for="month-select">Month:</label></div>');

// Append the dropdowns inside the container
$('.dropdown-container').eq(0).append(departmentDropdown);
$('.dropdown-container').eq(1).append(monthDropdown);

// Initialize Select2 for better UI
$('.dropdown').select2({
  width: '200px', // Adjust dropdown width
  placeholder: "Select an option",
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
        colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
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
