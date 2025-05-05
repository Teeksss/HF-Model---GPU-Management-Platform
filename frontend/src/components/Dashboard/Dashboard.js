import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Progress,
  Button,
  Spinner,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaServer, FaMemory, FaMicrochip, FaDatabase } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { getUserData } from '../../services/auth';

// Chart.js kayıt
Chart.register(...registerables);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [gpuData, setGpuData] = useState([]);
  const [models, setModels] = useState([]);
  const [userData, setUserData] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Sistem bilgilerini yükle
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Sistem bilgilerini al
        const systemResponse = await api.get('/system');
        setSystemInfo(systemResponse.data);
        
        // GPU verilerini al
        const gpuResponse = await api.get('/gpus');
        setGpuData(gpuResponse.data);
        
        // Model verilerini al
        const modelsResponse = await api.get('/models', { params: { limit: 5 } });
        setModels(modelsResponse.data);
        
        // Kullanıcı verilerini al
        const user = getUserData();
        setUserData(user);
        
        setError(null);
      } catch (err) {
        setError('Dashboard verileri yüklenemedi');
        toast({
          title: 'Hata',
          description: err.response?.data?.detail || 'Veriler yüklenirken bir hata oluştu',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [toast]);
  
  // GPU kullanım grafiği için veri
  const gpuChartData = {
    labels: gpuData.map(gpu => `GPU ${gpu.index}`),
    datasets: [
      {
        label: 'GPU Kullanımı (%)',
        data: gpuData.map(gpu => gpu.utilization_percent),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Bellek Kullanımı (%)',
        data: gpuData.map(gpu => (gpu.used_memory_mb / gpu.total_memory_mb) * 100),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Model türleri için veri
  const modelTasksData = () => {
    const tasks = {};
    models.forEach(model => {
      if (model.task) {
        tasks[model.task] = (tasks[model.task] || 0) + 1;
      } else {
        tasks['Diğer'] = (tasks['Diğer'] || 0) + 1;
      }
    });
    
    return {
      labels: Object.keys(tasks),
      datasets: [
        {
          data: Object.values(tasks),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="70vh">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Box textAlign="center" p={10}>
        <Heading size="md" mb={4}>Veriler yüklenemedi</Heading>
        <Text>{error}</Text>
        <Button mt={4} onClick={() => window.location.reload()}>Yeniden Dene</Button>
      </Box>
    );
  }
  
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Dashboard</Heading>
      
      {/* Hoş geldiniz kartı */}
      <Card bg={cardBg} mb={6} p={4}>
        <CardBody>
          <Heading size="md" mb={2}>Hoş Geldiniz, {userData?.full_name || userData?.username || 'Kullanıcı'}</Heading>
          <Text>AI Model Yönetim Platformu'na hoş geldiniz. Bu dashboard'da sistem durumunu izleyebilir ve önemli bilgilere hızlıca erişebilirsiniz.</Text>
        </CardBody>
      </Card>
      
      {/* Durum kartları */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <Flex alignItems="center">
                <Box color="blue.500" mr={2}>
                  <FaServer size="24px" />
                </Box>
                <StatLabel>GPU Sayısı</StatLabel>
              </Flex>
              <StatNumber>{systemInfo?.gpu_info?.count || 0}</StatNumber>
              <StatHelpText>Sistemde aktif</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <Flex alignItems="center">
                <Box color="green.500" mr={2}>
                  <FaDatabase size="24px" />
                </Box>
                <StatLabel>Model Sayısı</StatLabel>
              </Flex>
              <StatNumber>{models.length}</StatNumber>
              <StatHelpText>
                Toplam yüklü model
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <Flex alignItems="center">
                <Box color="purple.500" mr={2}>
                  <FaMicrochip size="24px" />
                </Box>
                <StatLabel>Ortalama GPU Kullanımı</StatLabel>
              </Flex>
              <StatNumber>
                {gpuData.length > 0
                  ? `${(gpuData.reduce((sum, gpu) => sum + gpu.utilization_percent, 0) / gpuData.length).toFixed(1)}%`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>
                Tüm GPU'lar
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <Flex alignItems="center">
                <Box color="red.500" mr={2}>
                  <FaMemory size="24px" />
                </Box>
                <StatLabel>Toplam GPU Belleği</StatLabel>
              </Flex>
              <StatNumber>
                {gpuData.length > 0
                  ? `${(gpuData.reduce((sum, gpu) => sum + gpu.total_memory_mb, 0) / 1024).toFixed(1)} GB`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>
                {gpuData.length > 0
                  ? `${(gpuData.reduce((sum, gpu) => sum + gpu.free_memory_mb, 0) / 1024).toFixed(1)} GB boş`
                  : ''}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Grafik ve son modeller */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">GPU Kullanımı</Heading>
          </CardHeader>
          <CardBody>
            {gpuData.length > 0 ? (
              <Box height="300px">
                <Line
                  data={gpuChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Kullanım (%)'
                        }
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              <Box textAlign="center" py={10}>
                <Text>Hiç GPU verisi bulunamadı</Text>
              </Box>
            )}
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Model Türleri</Heading>
          </CardHeader>
          <CardBody>
            {models.length > 0 ? (
              <Box height="300px">
                <Doughnut
                  data={modelTasksData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </Box>
            ) : (
              <Box textAlign="center" py={10}>
                <Text>Hiç model verisi bulunamadı</Text>
              </Box>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Son yüklenen modeller */}
      <Card bg={cardBg} mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Son Yüklenen Modeller</Heading>
            <Button size="sm" onClick={() => navigate('/models')}>Tümünü Gör</Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {models.length > 0 ? (
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <GridItem fontWeight="bold">Model Adı</GridItem>
              <GridItem fontWeight="bold">Türü</GridItem>
              <GridItem fontWeight="bold">Framework</GridItem>
              
              {models.slice(0, 5).map(model => (
                <React.Fragment key={model.id}>
                  <GridItem>{model.model_name}</GridItem>
                  <GridItem>{model.task || 'Belirtilmemiş'}</GridItem>
                  <GridItem>{model.framework || 'Belirtilmemiş'}</GridItem>
                </React.Fragment>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Text>Hiç model bulunamadı</Text>
              <Button mt={4} colorScheme="blue" onClick={() => navigate('/models/add')}>
                Model Ekle
              </Button>
            </Box>
          )}
        </CardBody>
      </Card>
      
      {/* GPU Durumları */}
      <Card bg={cardBg}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">GPU Durumları</Heading>
            <Button size="sm" onClick={() => navigate('/gpu-monitor')}>Detaylı Görünüm</Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {gpuData.length > 0 ? (
            <Grid templateColumns="repeat(12, 1fr)" gap={4}>
              <GridItem colSpan={2} fontWeight="bold">GPU</GridItem>
              <GridItem colSpan={2} fontWeight="bold">Sıcaklık</GridItem>
              <GridItem colSpan={4} fontWeight="bold">Kullanım</GridItem>
              <GridItem colSpan={4} fontWeight="bold">Bellek</GridItem>
              
              {gpuData.map(gpu => (
                <React.Fragment key={gpu.index}>
                  <GridItem colSpan={2}>GPU {gpu.index}: {gpu.name.split(' ').slice(-1)[0]}</GridItem>
                  <GridItem colSpan={2}>{gpu.temperature_c}°C</GridItem>
                  <GridItem colSpan={4}>
                    <Flex alignItems="center">
                      <Text width="60px">{gpu.utilization_percent.toFixed(1)}%</Text>
                      <Progress
                        flex="1"
                        value={gpu.utilization_percent}
                        colorScheme={gpu.utilization_percent < 30 ? 'green' : gpu.utilization_percent < 70 ? 'yellow' : 'red'}
                        size="sm"
                      />
                    </Flex>
                  </GridItem>
                  <GridItem colSpan={4}>
                    <Flex alignItems="center">
                      <Text width="150px">{(gpu.used_memory_mb / 1024).toFixed(1)} / {(gpu.total_memory_mb / 1024).toFixed(1)} GB</Text>
                      <Progress
                        flex="1"
                        value={(gpu.used_memory_mb / gpu.total_memory_mb) * 100}
                        colorScheme={(gpu.used_memory_mb / gpu.total_memory_mb) < 0.3 ? 'green' : (gpu.used_memory_mb / gpu.total_memory_mb) < 0.7 ? 'yellow' : 'red'}
                        size="sm"
                      />
                    </Flex>
                  </GridItem>
                </React.Fragment>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Text>Hiç GPU verisi bulunamadı</Text>
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;