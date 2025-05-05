import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';

/**
 * İstatistik bar grafiği bileşeni
 * 
 * @param {Object} props
 * @param {Array} props.labels - Etiketler
 * @param {Array} props.data - Veri
 * @param {string} props.label - Grafik etiketi
 * @param {string} props.yAxisLabel - Y eksen etiketi
 * @param {number} props.height - Grafik yüksekliği
 * @param {string} props.backgroundColor - Çubuk arka plan rengi
 * @param {string} props.borderColor - Çubuk kenar rengi
 */
const StatsBarChart = ({
  labels = [],
  data = [],
  label = 'Değer',
  yAxisLabel = '',
  height = 300,
  backgroundColor = 'rgba(54, 162, 235, 0.5)',
  borderColor = 'rgba(54, 162, 235, 1)',
}) => {
  const gridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const textColor = useColorModeValue('#333', '#CCC');

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: label,
        data: data,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: textColor,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
  };

  return (
    <Box height={`${height}px`}>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default StatsBarChart;