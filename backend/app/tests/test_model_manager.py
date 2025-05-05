"""
Model yöneticisi için test dosyası
"""
import unittest
import tempfile
import os
import shutil
from unittest.mock import patch, MagicMock

import torch

from app.services.hf_integration import HuggingFaceIntegration
from app.services.model_optimizer import ModelOptimizer
from app.services.gpu_manager import GPUManager

class TestHuggingFaceIntegration(unittest.TestCase):
    """HuggingFace entegrasyonu testleri"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.hf_integration = HuggingFaceIntegration(model_storage_path=self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    @patch('app.services.hf_integration.snapshot_download')
    @patch('app.services.hf_integration.get_db_session')
    @patch('app.services.hf_integration.ModelMetadata')
    @patch('app.services.hf_integration.ModelVersion')
    def test_download_model(self, mock_version, mock_model, mock_db, mock_snapshot):
        # Mock veritabanı
        mock_session = MagicMock()
        mock_db.return_value = iter([mock_session])
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        # Mock model bilgileri
        self.hf_integration._get_model_info = MagicMock(return_value={
            "task": "text-classification",
            "framework": "pytorch",
            "commit_hash": "abc123"
        })
        self.hf_integration._get_directory_size = MagicMock(return_value=12345)
        
        # Test
        success, message, path = self.hf_integration.download_model("test/model")
        
        # Assert
        self.assertTrue(success)
        self.assertIn("başarıyla indirildi", message)
        self.assertTrue(os.path.exists(self.temp_dir))
        mock_snapshot.assert_called_once()
        mock_session.add.assert_called()
        mock_session.commit.assert_called_once()
    
    @patch('app.services.hf_integration.get_db_session')
    @patch('os.path.exists')
    @patch('shutil.rmtree')
    def test_delete_model(self, mock_rmtree, mock_exists, mock_db):
        # Mock veritabanı
        mock_session = MagicMock()
        mock_db.return_value = iter([mock_session])
        mock_model = MagicMock()
        mock_model.model_path = os.path.join(self.temp_dir, "test_model")
        mock_session.query.return_value.filter.return_value.first.return_value = mock_model
        
        # Mock dosya kontrolü
        mock_exists.return_value = True
        
        # Test
        success, message = self.hf_integration.delete_model("test/model")
        
        # Assert
        self.assertTrue(success)
        self.assertIn("başarıyla silindi", message)
        mock_session.delete.assert_called_once_with(mock_model)
        mock_session.commit.assert_called_once()
        mock_rmtree.assert_called_once_with(mock_model.model_path, ignore_errors=True)


class TestModelOptimizer(unittest.TestCase):
    """Model optimizer testleri"""
    
    def setUp(self):
        self.model_optimizer = ModelOptimizer()
        
        # GPU Manager mock'u oluştur
        gpu_manager_patch = patch('app.services.model_optimizer.GPUManager')
        self.mock_gpu_manager = gpu_manager_patch.start()
        self.addCleanup(gpu_manager_patch.stop)
        
        # Torch mock'ları oluştur
        torch_patch = patch('app.services.model_optimizer.torch')
        self.mock_torch = torch_patch.start()
        self.addCleanup(torch_patch.stop)
        
        # Transformers mock'ları oluştur
        automodel_patch = patch('app.services.model_optimizer.AutoModel')
        self.mock_automodel = automodel_patch.start()
        self.addCleanup(automodel_patch.stop)
        
        autotokenizer_patch = patch('app.services.model_optimizer.AutoTokenizer')
        self.mock_autotokenizer = autotokenizer_patch.start()
        self.addCleanup(autotokenizer_patch.stop)
    
    def test_load_model(self):
        # GPU mock'unu ayarla
        mock_gpu_manager_instance = self.mock_gpu_manager.return_value
        mock_gpu_manager_instance.detect_gpus.return_value = [
            {"index": 0, "name": "Test GPU", "free_memory_mb": 8000}
        ]
        
        # Model ve tokenizer mock'larını ayarla
        mock_model = MagicMock()
        self.mock_automodel.from_pretrained.return_value = mock_model
        
        mock_tokenizer = MagicMock()
        self.mock_autotokenizer.from_pretrained.return_value = mock_tokenizer
        
        # Test
        result = self.model_optimizer.load_model(
            model_path="/fake/path",
            model_id="test/model",
            gpu_index=0,
            quantize=True,
            use_fp16=True
        )
        
        # Assert
        self.assertTrue(result["success"])
        self.assertEqual(result["model_id"], "test/model")
        self.assertEqual(result["gpu_index"], 0)
        self.assertTrue(result["quantized"])
        self.assertTrue(result["fp16"])
        self.assertIn("cuda:0", result["device"])
        
        # Model ve tokenizer çağrılarını kontrol et
        self.mock_automodel.from_pretrained.assert_called_once()
        self.mock_autotokenizer.from_pretrained.assert_called_once()
        
        # GPU bellek temizleme çağrısını kontrol et
        self.mock_torch.cuda.empty_cache.assert_called()
    
    def test_unload_model(self):
        # Test modeli yükle
        self.model_optimizer.models["test/model"] = MagicMock()
        self.model_optimizer.models["test/model"].to = MagicMock()
        self.model_optimizer.tokenizers["test/model"] = MagicMock()
        self.model_optimizer.model_configs["test/model"] = MagicMock()
        
        # Test
        result = self.model_optimizer.unload_model("test/model")
        
        # Assert
        self.assertTrue(result["success"])
        self.assertIn("bellekten kaldırıldı", result["message"])
        
        # Model artık yüklü olmamalı
        self.assertNotIn("test/model", self.model_optimizer.models)
        self.assertNotIn("test/model", self.model_optimizer.tokenizers)
        self.assertNotIn("test/model", self.model_optimizer.model_configs)
        
        # Bellek temizleme çağrılarını kontrol et
        self.mock_torch.cuda.empty_cache.assert_called_once()


class TestGPUManager(unittest.TestCase):
    """GPU yöneticisi testleri"""
    
    def setUp(self):
        # NVIDIA SMI mock'unu oluştur
        nvidia_smi_patch = patch('app.services.gpu_manager.nvidia_smi', NVIDIA_SMI_AVAILABLE=False)
        self.mock_nvidia_smi = nvidia_smi_patch.start()
        self.addCleanup(nvidia_smi_patch.stop)
        
        # Subprocess mock'unu oluştur
        subprocess_patch = patch('app.services.gpu_manager.subprocess')
        self.mock_subprocess = subprocess_patch.start()
        self.addCleanup(subprocess_patch.stop)
        
        self.gpu_manager = GPUManager()
    
    def test_detect_gpus_cli(self):
        # Subprocess mock'unu ayarla
        mock_process = MagicMock()
        mock_process.stdout = "0, Tesla V100, 16384, 1024, 15360, 25, 45\n1, Tesla T4, 8192, 512, 7680, 10, 35"
        self.mock_subprocess.run.return_value = mock_process
        
        # Test
        gpus = self.gpu_manager._detect_gpus_cli()
        
        # Assert
        self.assertEqual(len(gpus), 2)
        self.assertEqual(gpus[0]["index"], 0)
        self.assertEqual(gpus[0]["name"], "Tesla V100")
        self.assertEqual(gpus[0]["total_memory_mb"], 16384.0)
        self.assertEqual(gpus[0]["temperature_c"], 45.0)
        
        self.assertEqual(gpus[1]["index"], 1)
        self.assertEqual(gpus[1]["name"], "Tesla T4")
        self.assertEqual(gpus[1]["free_memory_mb"], 7680.0)
        self.assertEqual(gpus[1]["utilization_percent"], 10.0)
        
        # Subprocess çağrısını kontrol et
        self.mock_subprocess.run.assert_called_once()
    
    def test_select_optimal_gpu(self):
        # GPU'ları mock'la
        self.gpu_manager.detect_gpus = MagicMock(return_value=[
            {
                "index": 0,
                "name": "Tesla V100",
                "total_memory_mb": 16384.0,
                "used_memory_mb": 8192.0,
                "free_memory_mb": 8192.0,
                "utilization_percent": 50.0,
                "temperature_c": 60.0
            },
            {
                "index": 1,
                "name": "Tesla T4",
                "total_memory_mb": 8192.0,
                "used_memory_mb": 1024.0,
                "free_memory_mb": 7168.0,
                "utilization_percent": 10.0,
                "temperature_c": 40.0
            }
        ])
        
        # Test
        optimal_gpu = self.gpu_manager.select_optimal_gpu(min_memory_mb=4000)
        
        # Assert: T4 daha az kullanımda ve yeterli belleğe sahip olduğu için seçilmeli
        self.assertEqual(optimal_gpu, 1)
        
        # Minimum bellek çok yüksek olduğunda
        optimal_gpu = self.gpu_manager.select_optimal_gpu(min_memory_mb=10000)
        self.assertIsNone(optimal_gpu)


if __name__ == '__main__':
    unittest.main()