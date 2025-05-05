import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import ModelList from '../ModelList';
import api from '../../../services/api';

// Mock api modülü
jest.mock('../../../services/api');

// Mock veriler
const mockModels = [
  {
    id: 1,
    model_id: 'facebook/bart-large-cnn',
    model_name: 'bart-large-cnn',
    description: 'A test model for summarization',
    task: 'summarization',
    framework: 'pytorch',
    is_public: true,
    last_updated: '2025-05-01T10:30:00Z'
  },
  {
    id: 2,
    model_id: 'gpt2',
    model_name: 'gpt2',
    description: 'OpenAI GPT-2 model',
    task: 'text-generation',
    framework: 'pytorch',
    is_public: true,
    last_updated: '2025-05-02T15:45:00Z'
  }
];

// ModelList bileşenini sarmak için kullanılan yardımcı fonksiyon
const renderWithProviders = (ui) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </ChakraProvider>
  );
};

describe('ModelList Component', () => {
  beforeEach(() => {
    // Mock api yanıtlarını ayarla
    api.get.mockResolvedValue({ data: mockModels });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    renderWithProviders(<ModelList />);
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
  });

  test('renders model list after loading', async () => {
    renderWithProviders(<ModelList />);
    
    // Modellerin yüklenmesini bekle
    await waitFor(() => {
      expect(screen.getByText('bart-large-cnn')).toBeInTheDocument();
      expect(screen.getByText('gpt2')).toBeInTheDocument();
    });
    
    // Task bilgilerini kontrol et
    expect(screen.getByText('summarization')).toBeInTheDocument();
    expect(screen.getByText('text-generation')).toBeInTheDocument();
    
    // API çağrısının doğru parametrelerle yapıldığını kontrol et
    expect(api.get).toHaveBeenCalledWith('/models', expect.any(Object));
  });
  
  test('filters models based on search input', async () => {
    renderWithProviders(<ModelList />);
    
    // Modellerin yüklenmesini bekle
    await waitFor(() => {
      expect(screen.getByText('bart-large-cnn')).toBeInTheDocument();
    });
    
    // Arama kutusuna bir değer gir
    const searchInput = screen.getByPlaceholderText(/ara/i);
    fireEvent.change(searchInput, { target: { value: 'gpt' } });
    
    // API'nin yeni arama terimiyle çağrıldığını kontrol et
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/models', {
        params: expect.objectContaining({
          search: 'gpt'
        })
      });
    });
  });
  
  test('shows error message when API call fails', async () => {
    // API hatasını simüle et
    api.get.mockRejectedValueOnce({ 
      response: { data: { detail: 'API error occurred' } } 
    });
    
    renderWithProviders(<ModelList />);
    
    // Hata mesajının gösterilmesini bekle
    await waitFor(() => {
      expect(screen.getByText(/yüklenemedi/i)).toBeInTheDocument();
    });
  });
  
  test('opens delete confirmation modal when delete button is clicked', async () => {
    renderWithProviders(<ModelList />);
    
    // Modellerin yüklenmesini bekle
    await waitFor(() => {
      expect(screen.getByText('bart-large-cnn')).toBeInTheDocument();
    });
    
    // İlk modelin sil butonuna tıkla
    const deleteButtons = screen.getAllByText('Sil');
    fireEvent.click(deleteButtons[0]);
    
    // Onay modalının açıldığını kontrol et
    expect(screen.getByText(/silmek istediğinizden emin misiniz/i)).toBeInTheDocument();
  });
});