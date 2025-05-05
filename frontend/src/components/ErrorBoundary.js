import React, { Component } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  Code,
  VStack,
  Collapse
} from '@chakra-ui/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Bir sonraki render'da fallback UI göstermek için state'i güncelle
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Hata detaylarını state'e kaydet
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Hata logları burada bir hata izleme servisine gönderilebilir
    console.error("UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          p={8} 
          maxW="800px" 
          mx="auto" 
          my={10} 
          borderRadius="md" 
          boxShadow="lg"
          bg="white"
          _dark={{ bg: "gray.700" }}
        >
          <Alert 
            status="error" 
            variant="solid" 
            borderRadius="md"
            mb={6}
          >
            <AlertIcon />
            <AlertTitle mr={2}>Bir hata oluştu!</AlertTitle>
            <AlertDescription>Uygulama beklenmeyen bir sorunla karşılaştı.</AlertDescription>
          </Alert>
          
          <VStack align="stretch" spacing={4}>
            <Heading size="md">
              {this.state.error && this.state.error.toString()}
            </Heading>
            
            <Text>
              Lütfen sayfayı yenilemeyi deneyin. Sorun devam ederse sistem yöneticisiyle iletişime geçin.
            </Text>
            
            <Box>
              <Button 
                onClick={() => this.setState({showDetails: !this.state.showDetails})}
                size="sm"
                colorScheme="blue"
                variant="outline"
                mb={4}
              >
                {this.state.showDetails ? 'Detayları Gizle' : 'Hata Detaylarını Göster'}
              </Button>
              
              <Collapse in={this.state.showDetails} animateOpacity>
                <Box 
                  p={4} 
                  borderRadius="md" 
                  bg="gray.50" 
                  _dark={{ bg: "gray.800" }}
                  overflowX="auto"
                >
                  <Heading size="sm" mb={2}>Hata Ayrıntıları:</Heading>
                  <Code p={2} width="100%" display="block" whiteSpace="pre-wrap">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </Code>
                </Box>
              </Collapse>
            </Box>
            
            <Box mt={4}>
              <Button 
                colorScheme="blue" 
                onClick={() => window.location.reload()}
                mr={3}
              >
                Sayfayı Yenile
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Ana Sayfaya Dön
              </Button>
            </Box>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;