import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Grid,
  SimpleGrid,
  Progress,
  Badge,
  Button,
  Icon,
  Spinner,
  useToast,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Stack,
  Divider,
  HStack,
  Tooltip,
} from '@chakra-ui/react';
import { RepeatIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons';
import { FaMemory, FaThermometerHalf, FaMicrochip } from 'react-icons/fa';
import api from '../../services/api';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Chart.js kayıt
Chart.register(...registerables);

// Renk tanımlamaları
const getUtilizationColor = (percent) => {
  if (percent < 30) return 'green.500';
  if (percent < 70) return 'yellow.500';
  return 'red.500';
};

const getTemperatureColor = (temp) => {
  if (temp < 50) return 'green.500';
  if (temp < 80) return 'yellow.500';
  return 'red.500';
};

const GPUMonitor = () => {
  const [gpuData, setGpuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 saniye
  const [historyData, setHistoryData] = useState({}); // GPU geçmişi için
  const intervalRef = useRef(null);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  
  const MAX_HISTORY_POINTS = 20; // Grafikte gösterilecek maksimum nokta sayısı
  
  // GPU verilerini çek
  const fetchGPUData = async () => {
    try {
      const response = await api.get('/gpus');
      setGpuData(response.data);
      
      // Geçmiş verileri güncelle
      updateHistoryData(response.data);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'GPU verileri alınamadı');
      toast({
        title: 'GPU verileri alınamadı',
        description: err.response?.data?.detail || 'Bağlantı hatası',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Geçmiş verileri güncelle
  const updateHistoryData = (newData) => {
    const currentTime = new Date().toLocaleTimeString();
    
    setHistoryData(prevHistory => {
      const newHistory = { ...prevHistory };
      
      newData.forEach(gpu => {
        const gpuId = `gpu-${gpu.index}`;
        
        if (!newHistory[gpuId]) {
          newHistory[gpuId] = {
            utilization: {
              labels: [currentTime],
              data: [gpu.utilization_percent]
            },
            memory: {
              labels: [currentTime],
              data: [gpu.used_memory_mb / gpu.total_memory_mb * 100]
            },
            temperature: {
              labels: [currentTime],
              data: [gpu.temperature_c]
            }
          };
        } else {
          // Yeni veri ekle
          ['utilization', 'memory', 'temperature'].forEach(metric => {
            newHistory[gpuId][metric].labels.push(currentTime);
            
            // Metriğe göre değeri al
            let value;
            if (metric === 'utilization') value = gpu.utilization_percent;
            else if (metric === 'memory') value = gpu.used_memory_mb / gpu.total_memory_mb * 100;
            else if (metric === 'temperature') value = gpu.temperature_c;
            
            newHistory[gpuId][metric].data.push(value);
            
            // Maksimum nokta sayısını aşarsa ilk verileri çıkar
            if (newHistory[gpuId][metric].labels.length > MAX_HISTORY_POINTS) {
              newHistory[gpuId][metric].labels.shift();
              newHistory[gpuId][metric].data.shift();
            }
          });
        }
      });
      
      return newHistory;
    });
  };
  
  // İlk yükleme
  useEffect(() => {
    fetchGPUData();
    
    // Düzenli aralıklarla veri güncelle
    intervalRef.current = setInterval(fetchGPUData, refreshInterval);
    
    // Temizleme
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);
  
  // Yenileme aralığını değiştir
  const changeRefreshInterval = (ms) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setRefreshInterval(ms);
    intervalRef.current = setInterval(fetchGPUData, ms);
    
    toast({
      title: 'Yenileme aralığı güncellendi',
      description: `Veriler ${ms / 1000} saniyede bir güncellenecek`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Grafik için yapılandırma
  const getChartConfig = (metricData, label, color) => {
    return {
      labels: metricData.labels,
      datasets: [
        {
          label: label,
          data: metricData.data,
          fill: false,
          borderColor: color,
          tension: 0.4
        },
      ],
    };
  };
  
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)')
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    animation: false
  };
  
  // GPU'yu optimal olana göre seç
  const selectOptimalGPU = async () => {
    try {
      const response = await api.get('/gpus/optimal');
      
      if (response.data.found) {
        toast({
          title: 'Optimal GPU',
          description: `Önerilen GPU: GPU ${response.data.gpu_index} (${response.data.gpu_info.name})`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Optimal GPU bulunamadı',
          description: response.data.message,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Hata',
        description: err.response?.data?.detail || 'Optimal GPU seçilirken bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  if (loading) {
    return (
      <Box textAlign="center" p={10}>
        <Spinner size="xl" />
        <Text mt={4}>GPU verileri yükleniyor...</Text>
      </Box>
    );
  }
  
  if (error && gpuData.length === 0) {
    return (
      <Box textAlign="center" p={10}>
        <Icon as={WarningIcon} w={10} h={10} color="red.500" />
        <Text mt={4} fontSize="xl">GPU verileri alınamadı</Text>
        <Text mt={2}>{error}</Text>
        <Button mt={4} leftIcon={<RepeatIcon />} onClick={fetchGPUData}>
          Yeniden Dene
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">GPU İzleme</Heading>
        <HStack spacing={4}>
          <Button 
            size="sm" 
            onClick={selectOptimalGPU}
            colorScheme="green"
          >
            Optimal GPU Seç
          </Button>
          
          <Button 
            size="sm" 
            onClick={fetchGPUData} 
            leftIcon={<RepeatIcon />}
          >
            Yenile
          </Button>
          
          <Tooltip label="Yenileme aralığını değiştir">
            <Box>
              <HStack spacing={1}>
                <Button 
                  size="sm" 
                  onClick={() => changeRefreshInterval(2000)}
                  colorScheme={refreshInterval === 2000 ? "blue" : "gray"}
                >
                  2s
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => changeRefreshInterval(5000)}
                  colorScheme={refreshInterval === 5000 ? "blue" : "gray"}
                >
                  5s
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => changeRefreshInterval(10000)}
                  colorScheme={refreshInterval === 10000 ? "blue" : "gray"}
                >
                  10s
                </Button>
              </HStack>
            </Box>
          </Tooltip>
        </HStack>
      </Flex>
      
      {gpuData.length === 0 ? (
        <Box textAlign="center" p={10}>
          <Icon as={InfoIcon} w={10} h={10} color="blue.500" />
          <Text mt={4} fontSize="xl">GPU bulunamadı</Text>
          <Text mt={2}>Sistemde herhangi bir NVIDIA GPU tespit edilemedi.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {gpuData.map((gpu) => (
            <Card key={gpu.index} bg={cardBg} boxShadow="md">
              <CardHeader pb={0}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md" color={textColor}>
                    GPU {gpu.index}: {gpu.name}
                  </Heading>
                  <Badge
                    colorScheme={gpu.temperature_c > 80 ? 'red' : gpu.temperature_c > 60 ? 'yellow' : 'green'}
                    fontSize="sm"
                  >
                    {gpu.temperature_c}°C
                  </Badge>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Stat mb={4}>
                      <StatLabel>GPU Kullanımı</StatLabel>
                      <Flex alignItems="center">
                        <StatNumber>{gpu.utilization_percent.toFixed(1)}%</StatNumber>
                        <Icon as={FaMicrochip} ml={2} color={getUtilizationColor(gpu.utilization_percent)} />
                      </Flex>
                      <Progress
                        value={gpu.utilization_percent}
                        colorScheme={gpu.utilization_percent < 30 ? 'green' : gpu.utilization_percent < 70 ? 'yellow' : 'red'}
                        size="sm"
                        mt={2}
                      />
                    </Stat>
                    
                    <Box height="100px" mb={4}>
                      {historyData[`gpu-${gpu.index}`] && (
                        <Line
                          data={getChartConfig(
                            historyData[`gpu-${gpu.index}`].utilization,
                            'Kullanım %',
                            'rgb(66, 153, 225)'
                          )}
                          options={chartOptions}
                        />
                      )}
                    </Box>
                    
                    <Divider mb={4} />
                    
                    <Stat mb={4}>
                      <StatLabel>Bellek</StatLabel>
                      <Flex alignItems="center">
                        <StatNumber>
                          {gpu.used_memory_mb.toFixed(0)} / {gpu.total_memory_mb.toFixed(0)} MB
                        </StatNumber>
                        <Icon as={FaMemory} ml={2} color={getUtilizationColor(gpu.used_memory_mb / gpu.total_memory_mb * 100)} />
                      </Flex>
                      <StatHelpText>
                        {(gpu.free_memory_mb / 1024).toFixed(2)} GB Boş
                      </StatHelpText>
                      <Progress
                        value={(gpu.used_memory_mb / gpu.total_memory_mb) * 100}
                        colorScheme={(gpu.used_memory_mb / gpu.total_memory_mb) < 0.3 ? 'green' : (gpu.used_memory_mb / gpu.total_memory_mb) < 0.7 ? 'yellow' : 'red'}
                        size="sm"
                        mt={2}
                      />
                    </Stat>
                    
                    <Box height="100px">
                      {historyData[`gpu-${gpu.index}`] && (
                        <Line
                          data={getChartConfig(
                            historyData[`gpu-${gpu.index}`].memory,
                            'Bellek %',
                            'rgb(237, 100, 166)'
                          )}
                          options={chartOptions}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Stat mb={4}>
                      <StatLabel>Sıcaklık</StatLabel>
                      <Flex alignItems="center">
                        <StatNumber>{gpu.temperature_c.toFixed(1)}°C</StatNumber>
                        <Icon as={FaThermometerHalf} ml={2} color={getTemperatureColor(gpu.temperature_c)} />
                      </Flex>
                      <Progress
                        value={(gpu.temperature_c / 100) * 100}
                        colorScheme={gpu.temperature_c < 50 ? 'green' : gpu.temperature_c < 80 ? 'yellow' : 'red'}
                        size="sm"
                        mt={2}
                      />
                    </Stat>
                    
                    <Box height="100px" mb={4}>
                      {historyData[`gpu-${gpu.index}`] && (
                        <Line
                          data={getChartConfig(
                            historyData[`gpu-${gpu.index}`].temperature,
                            'Sıcaklık °C',
                            'rgb(245, 101, 101)'
                          )}
                          options={chartOptions}
                        />
                      )}
                    </Box>
                    
                    <Divider mb={4} />
                    
                    <Stat>
                      <StatLabel>Bellek Bilgileri</StatLabel>
                      <Box mt={2}>
                        <HStack justifyContent="space-between">
                          <Text fontSize="sm">Toplam:</Text>
                          <Text fontSize="sm" fontWeight="bold">{(gpu.total_memory_mb / 1024).toFixed(2)} GB</Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                          <Text fontSize="sm">Kullanılan:</Text>
                          <Text fontSize="sm" fontWeight="bold">{(gpu.used_memory_mb / 1024).toFixed(2)} GB</Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                          <Text fontSize="sm">Boş:</Text>
                          <Text fontSize="sm" fontWeight="bold">{(gpu.free_memory_mb / 1024).toFixed(2)} GB</Text>
                        </HStack>
                      </Box>
                    </Stat>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default GPUMonitor;