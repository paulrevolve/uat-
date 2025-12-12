// import React from 'react';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import { Line } from 'react-chartjs-2';

// // Register Chart.js components required for a line chart
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // Configuration options for the chart
// const options = {
//   responsive: true,
//   maintainAspectRatio: false, // Allows chart to fill container better
//   plugins: {
//     legend: {
//       position: 'top',
//     },
//     title: {
//       display: true,
//       text: 'Monthly Project Spend Analysis (Sample Data)',
//     },
//   },
//   scales: {
//     y: {
//       beginAtZero: true,
//       title: {
//         display: true,
//         text: 'Spend ($)',
//       },
//     },
//     x: {
//       title: {
//         display: true,
//         text: 'Month',
//       },
//     }
//   }
// };

// // Sample data for the line chart
// const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

// const sampleData = {
//   labels,
//   datasets: [
//     {
//       label: 'Actual Spend',
//       data: [12000, 19000, 3000, 5000, 2000, 30000, 45000],
//       borderColor: 'rgb(53, 162, 235)',
//       backgroundColor: 'rgba(53, 162, 235, 0.5)',
//       tension: 0.4, // Smooth curve
//     },
//     {
//       label: 'Budgeted Spend',
//       data: [10000, 15000, 5000, 7000, 4000, 25000, 40000],
//       borderColor: 'rgb(255, 99, 132)',
//       backgroundColor: 'rgba(255, 99, 132, 0.5)',
//       tension: 0.4,
//       borderDash: [5, 5], // Dotted line for budget
//     },
//   ],
// };

// const SpendChart = () => {
//   return (
//     <div className="p-4 bg-white rounded-xl shadow-lg">
//       <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Spend Chart</h2>
//       {/* Set a fixed height for the chart container */}
//       <div style={{ height: '400px', width: '100%' }}>
//         <Line options={options} data={sampleData} />
//       </div>
//       <p className="text-sm text-gray-500 mt-4">
//         This chart displays a comparison of actual vs. budgeted spend over the past few months.
//       </p>
//     </div>
//   );
// };

// export default SpendChart;

import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- MOCK DATA TRANSFORMATION FUNCTION FOR SPEND CHART ---
const transformCostToCumulativeSpendData = () => {
    // This function generates mock data to display the chart structure.
    
    const labels = [
        "Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25", "Jun '25", 
        "Jul '25", "Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25"
    ];

    // Simulated Cumulative Forecast (Cost)
    const forecastData = [
        50000, 120000, 200000, 300000, 420000, 560000, 
        720000, 900000, 1100000, 1320000, 1560000, 1820000
    ];

    // Simulated Budget and Funding
    const totalFunding = 2000000;
    const budgetData = [
        100000, 250000, 450000, 650000, 850000, 1050000, 
        1250000, 1450000, 1650000, 1850000, 2050000, 2250000
    ];
    const fundingData = Array(labels.length).fill(totalFunding);

    return {
        labels,
        datasets: [
            {
                label: 'Cumulative Forecast (Cost)',
                data: forecastData,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.4,
                pointRadius: 4,
            },
            {
                label: 'Cumulative Budget',
                data: budgetData,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.4,
                borderDash: [5, 5],
                pointRadius: 4,
            },
            {
                label: 'Funding Limit',
                data: fundingData, 
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.4,
                borderDash: [2, 2],
                pointRadius: 4,
            },
        ],
    };
};

// --- CHART OPTIONS (Copied from FinancialDashboard.jsx) ---
const spendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Cumulative Project Spend vs. Budget',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Cumulative Amount ($)',
      },
      ticks: {
        callback: function(value) {
            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return '$' + (value / 1000) + 'K';
            return '$' + value;
        }
      }
    },
    x: {
      title: {
        display: true,
        text: 'Period End Date',
      },
    }
  }
};


const SpendChart = ({ fullApiResponse }) => {
    // Use the transformation function to get chart data
    const spendChartData = useMemo(() => {
        // We ignore fullApiResponse for now and use internal mock generation
        return transformCostToCumulativeSpendData();
    }, [/* No dependencies needed as data is static mock */]);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                Spend Chart (Monthly Cumulative Trend)
            </h2>
            
            <div id="spend-chart-line" style={{ height: '500px', width: '100%' }}>
              {spendChartData && spendChartData.labels.length > 0 ? (
                  <Line options={spendChartOptions} data={spendChartData} />
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                      No Spend Chart data available.
                  </div>
              )}
              {/* <p className="text-xs text-blue-500 mt-2">
                  This data is currently simulated for display purposes.
              </p> */}
            </div>
        </div>
    );
};

export default SpendChart;