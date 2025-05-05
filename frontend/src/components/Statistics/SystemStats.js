import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import api from '../../services/api';

const SystemStats = () => {
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const toast = useToast();
  
  // İstatistikleri yükle
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/stats/summary', {
          params: { days: timeRange }
        });
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('İstatistikler yüklenemedi');
        toast({
          title: 'Hata',
          description: err.response?.data?.detail || 'İstatistikler alınamadı',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [timeRange, toast]);
  
  // Zaman aralığını değiştir
  const handleTimeRangeChange = (e) => {
    setTimeRange(parseInt(e.target.value, 10));
  };
  
  // Model türleri pasta grafiği verisi
  const getModelTypesChartData = () => {
    if (!stats || !stats.popular_models || stats.popular_models.length === 0) {
      return {
        labels: ['Veri yok'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['rgba(200, 200, 200, 0.7)'],
            borderWidth: 1,
          },
        ],
      };
    }
    
    // Model türlerine göre sayıları hesapla
    const taskCounts = {};
    stats.popular_models.forEach(model => {
      const task = model.task || 'Bilinmeyen';
      taskCounts[task] = (taskCounts[task] || 0) + 1;
    });
    
    return {
      labels: Object.keys(taskCounts),
      datasets: [
        {
          data: Object.values(taskCounts),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Kullanıcı aktivite grafiği verisi
  const getUserActivityChartData = () => {
    if (!stats || !stats.active_users_data || stats.active_users_data.length === 0) {
      return {
        labels: ['Veri yok'],
        datasets: [
          {
            label: 'GPU Kullanım (saat)',
            data: [0],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
          },
        ],
      };
    }
    
    return {
      labels: stats.active_users_data.map(user => user.username),
      datasets: [
        {
          label: 'GPU Kullanım (saat)',
          data: stats.active_users_data.map(user => user.gpu_usage_hours),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // GPU kullanım grafiği verisi 
  const getGpuUsageChartData = () => {
    if (!stats || !stats.gpu_usage_hours || Object.keys(stats.gpu_usage_hours).length === 0) {
      return {
        labels: ['Veri yok'],
        datasets: [
          {
            label: 'GPU Kullanım (saat)',
            data: [0],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false,
            tension: 0.4
          },
        ],
      };
    }
    
    // GPU indekslerini sırala
    const gpuIndices = Object.keys(stats.gpu_usage_hours).sort((a, b) => parseInt(a) - parseInt(b));
    
    return {
      labels: gpuIndices.map(index => `GPU ${index}`),
      datasets: [
        {
          label: 'GPU Kullanım (saat)',
          data: gpuIndices.map(index => stats.gpu_usage_hours[index]),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Yükleniyor gösterimi
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" mb={4}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Sistem İstatistikleri</Heading>
        <Box>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            w="200px"
          >
            <option value={7}>Son 7 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
            <option value={180}>Son 6 ay</option>
            <option value={365}>Son 1 yıl</option>
          </Select>
        </Box>
      </Flex>
      
      {/* Genel istatistikler */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Toplam Model</StatLabel>
              <StatNumber>{stats?.total_models || 0}</StatNumber>
              <StatHelpText>Sistemdeki toplam model sayısı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Toplam Kullanıcı</StatLabel>
              <StatNumber>{stats?.total_users || 0}</StatNumber>
              <StatHelpText>Kayıtlı kullanıcı sayısı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Aktif Kullanıcı</StatLabel>
              <StatNumber>{stats?.active_users || 0}</StatNumber>
              <StatHelpText>Aktif kullanıcı sayısı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Toplam GPU Kullanımı</StatLabel>
              <StatNumber>
                {stats?.gpu_usage_hours 
                  ? Object.values(stats.gpu_usage_hours).reduce((a, b) => a + b, 0).toFixed(1) 
                  : 0} saat
              </StatNumber>
              <StatHelpText>Tüm GPU'ların toplam kullanımı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Grafik ve tablolar */}
      <Tabs variant="enclosed" mb={6}>
        <TabList>
          <Tab>Model İstatistikleri</Tab>
          <Tab>Kullanıcı İstatistikleri</Tab>
          <Tab>GPU Kullanımı</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Model Türleri</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <Pie 
                      data={getModelTypesChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </Box>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="md">Popüler Modeller</Heading>
                </CardHeader>
                <CardBody>
                  {stats?.popular_models && stats.popular_models.length > 0 ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Model</Th>
                          <Th>Tür</Th>
                          <Th isNumeric>İndirme</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {stats.popular_models.slice(0, 5).map((model, index) => (
                          <Tr key={index}>
                            <Td>
                              <Text fontWeight="medium" noOfLines={1}>
                                {model.model_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                {model.model_id}
                              </Text>
                            </Td>
                            <Td>
                              {model.task ? (
                                <Badge colorScheme="purple">{model.task}</Badge>
                              ) : (
                                <Badge colorScheme="gray">Belirtilmemiş</Badge>
                              )}
                            </Td>
                            <Td isNumeric>{model.total_downloads}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text>Henüz model verisi bulunmuyor</Text>
                  )}
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Kullanıcı Aktivitesi</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <Bar 
                      data={getUserActivityChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'GPU Kullanım (saat)'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="md">Aktif Kullanıcılar</Heading>
                </CardHeader>
                <CardBody>
                  {stats?.active_users_data && stats.active_users_data.length > 0 ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Kullanıcı</Th>
                          <Th isNumeric>Model Sayısı</Th>
                          <Th isNumeric>GPU Kullanımı</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {stats.active_users_data.slice(0, 5).map((user, index) => (
                          <Tr key={index}>
                            <Td fontWeight="medium">{user.username}</Td>
                            <Td isNumeric>{user.model_count}</Td>
                            <Td isNumeric>{user.gpu_usage_hours.toFixed(1)} saat</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text>Henüz kullanıcı aktivitesi verisi bulunmuyor</Text>
                  )}
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
          
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">GPU Kullanım İstatistikleri</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <Bar 
                      data={getGpuUsageChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'GPU Kullanım (saat)'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="md">GPU Kullanım Detayları</Heading>
                </CardHeader>
                <CardBody>
                  {stats?.gpu_usage_hours && Object.keys(stats.gpu_usage_hours).length > 0 ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>GPU</Th>
                          <Th isNumeric>Toplam Kullanım</Th>
                          <Th isNumeric>Kullanım Oranı</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Object.entries(stats.gpu_usage_hours)
                          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                          .map(([gpuIndex, hours], index) => {
                            const totalHours = Object.values(stats.gpu_usage_hours).reduce((a, b) => a + b, 0);
                            const usagePercent = totalHours > 0 ? (hours / totalHours) * 100 : 0;
                            
                            return (
                              <Tr key={index}>
                                <Td fontWeight="medium">GPU {gpuIndex}</Td>
                                <Td isNumeric>{hours.toFixed(1)} saat</Td>
                                <Td isNumeric>
                                  <HStack justifyContent="flex-end">
                                    <Text>{usagePercent.toFixed(1)}%</Text>
                                    <Badge
                                      colorScheme={
                                        usagePercent > 70 ? 'green' : 
                                        usagePercent > 30 ? 'yellow' : 
                                        'red'
                                      }
                                    >
                                      {usagePercent > 70 ? 'Yüksek' : 
                                       usagePercent > 30 ? 'Orta' : 
                                       'Düşük'
                                      }
                                    </Badge>
                                  </HStack>
                                </Td>
                              </Tr>
                            );
                          })
                        }
                      </Tbody>
                    </Table>
                  ) : (
                    <Text>Henüz GPU kullanım verisi bulunmuyor</Text>
                  )}
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SystemStats;