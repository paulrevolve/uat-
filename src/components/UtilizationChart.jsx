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

// --- MOCK DATA SOURCE (Using the explicit Utilization column) ---
const RAW_MOCK_DATA = [
    // Source data structure: { date, direct, indirect, utilization }
    { date: "01/31/24", direct: 2875564.94, indirect: 382431.60, utilization: 88.26 },
    { date: "02/29/24", direct: 5622244.89, indirect: 735205.30, utilization: 88.43 },
    { date: "03/31/24", direct: 8408641.34, indirect: 1080356.08, utilization: 88.61 },
    { date: "04/30/24", direct: 11326899.95, indirect: 1466318.31, utilization: 88.54 },
    { date: "05/31/24", direct: 14285381.66, indirect: 1850755.21, utilization: 88.53 },
    { date: "06/30/24", direct: 16911327.88, indirect: 2171877.64, utilization: 88.62 },
    { date: "07/31/24", direct: 19832393.09, indirect: 2548502.17, utilization: 88.61 },
    { date: "08/31/24", direct: 22762743.27, indirect: 2925850.02, utilization: 88.61 },
    { date: "09/30/24", direct: 25694927.26, indirect: 3310250.95, utilization: 88.55 },
    { date: "10/31/24", direct: 28892454.74, indirect: 3757497.76, utilization: 88.49 },
    { date: "11/30/24", direct: 31464140.29, indirect: 4062028.85, utilization: 88.52 },
    { date: "12/31/24", direct: 34272135.26, indirect: 4372802.44, utilization: 88.67 },
];

// --- DATA TRANSFORMATION AND CALCULATION ---
const processUtilizationData = (data) => {
    const labels = [];
    const directLabor = [];
    const indirectLabor = [];
    const utilizationRate = []; // Will hold the 88.xx values

    data.forEach(item => {
        labels.push(item.date);
        
        directLabor.push(item.direct);
        indirectLabor.push(item.indirect);
        
        // CRITICAL FIX: Use the actual utilization value from the mock data (88.xx), 
        // ignoring the misleading calculation for chart stability.
        utilizationRate.push(item.utilization); 
    });
    
    return { labels, directLabor, indirectLabor, utilizationRate };
};

// --- CHART OPTIONS ---
const getUtilizationChartOptions = (utilAxisMin, utilAxisMax) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Labor Cost and Utilization Trend' },
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.dataset.label === 'Utilization') {
                        label += context.parsed.y.toFixed(2) + '%';
                    } else {
                        // Formatting Labor Costs back to Millions/K
                        const value = context.parsed.y;
                        if (value >= 1000000) return label + '$' + (value / 1000000).toFixed(2) + 'M';
                        if (value >= 1000) return label + '$' + (value / 1000).toFixed(0) + 'K';
                        return label + '$' + value.toFixed(0);
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        // Y-axis 0: Left Axis for Labor Costs (Primary)
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Labor Costs ($)' },
            beginAtZero: true,
            max: 40000000, 
            grid: { drawOnChartArea: true },
            ticks: {
                callback: function(value) {
                    if (value >= 1000000) return '$' + (value / 1000000).toFixed(0) + 'M';
                    return '$' + value;
                }
            }
        },
        // Y-axis 1: Right Axis for Utilization Rate (Secondary - Fixed Range)
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Utilization (%)' },
            // CRITICAL FIX: Setting user-requested precise min/max (88.25 to 88.75)
            min: utilAxisMin, 
            max: utilAxisMax, 
            grid: { drawOnChartArea: false },
            ticks: {
                callback: function(value) {
                    return value.toFixed(2) + '%';
                }
            }
        },
        x: {
            title: { display: true, text: 'Fiscal Year Sub-Periods' },
        }
    }
});


const UtilizationChart = () => {
    // Setting the requested static bounds
    const utilAxisMin = 88.25; 
    const utilAxisMax = 88.75; 

    const { labels, directLabor, indirectLabor, utilizationRate } = useMemo(() => {
        return processUtilizationData(RAW_MOCK_DATA);
    }, []);

    const utilizationChartOptions = getUtilizationChartOptions(utilAxisMin, utilAxisMax);

    const chartData = useMemo(() => {
        return {
            labels,
            datasets: [
                {
                    label: 'Utilization',
                    data: utilizationRate, // Now plotting the stable 88.xx data
                    borderColor: 'rgb(0, 0, 255)', 
                    backgroundColor: 'rgba(0, 0, 255, 0.5)',
                    yAxisID: 'y1', // Mapped to Right axis (y1)
                    tension: 0.4,
                    pointStyle: 'diamond', 
                    pointRadius: 6,
                    fill: false,
                },
                {
                    label: 'Direct Labor',
                    data: directLabor,
                    borderColor: 'rgb(0, 128, 0)', 
                    backgroundColor: 'rgba(0, 128, 0, 0.5)',
                    yAxisID: 'y', // Mapped to Left axis (y)
                    tension: 0.4,
                    pointRadius: 5,
                    fill: false,
                },
                {
                    label: 'Indirect Labor',
                    data: indirectLabor,
                    borderColor: 'rgb(255, 0, 0)', 
                    backgroundColor: 'rgba(255, 0, 0, 0.5)',
                    yAxisID: 'y', // Mapped to Left axis (y)
                    tension: 0.4,
                    pointRadius: 5,
                    fill: false,
                },
            ],
        };
    }, [labels, directLabor, indirectLabor, utilizationRate]);


    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                Utilization Chart 
            </h2>
            
            <div id="utilization-chart" style={{ height: '500px', width: '100%' }}>
              {labels.length > 0 ? (
                  <Line options={utilizationChartOptions} data={chartData} />
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                      No utilization data available.
                  </div>
              )}
            </div>
            {/* <p className="text-xs text-blue-600 mt-2">
                *The Utilization axis is fixed between 88.25% and 88.75%, plotting the 88.xx utilization data to ensure its visibility and scale detail against the Labor Cost axis.
            </p> */}
        </div>
    );
};

export default UtilizationChart;