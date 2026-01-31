"""
Synaptra Studio API Tests
Tests for: status, tasks, eval suites, eval runs, memory, settings
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8000').rstrip('/')

class TestSystemStatus:
    """System status endpoint tests"""
    
    def test_status_returns_operational(self):
        """Test /api/status returns operational status"""
        response = requests.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert data["ai_engine"] == "ready"
        assert data["database"] == "connected"
        assert data["memory_service"] == "active"
        assert data["eval_service"] == "active"
        assert "timestamp" in data
        assert "version" in data


class TestTasksAPI:
    """Task CRUD and execution tests"""
    
    def test_get_tasks_list(self):
        """Test /api/tasks returns task list"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify task structure if tasks exist
        if len(data) > 0:
            task = data[0]
            assert "id" in task
            assert "task_type" in task
            assert "status" in task
            assert "input_text" in task
            assert "execution_steps" in task
            assert "evaluation" in task
            assert "metadata" in task
    
    def test_get_task_with_execution_steps(self):
        """Test that tasks have execution_steps populated"""
        response = requests.get(f"{BASE_URL}/api/tasks?limit=1")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            task = data[0]
            # Verify execution_steps structure
            assert "execution_steps" in task
            if task["status"] == "completed":
                assert len(task["execution_steps"]) > 0
                step = task["execution_steps"][0]
                assert "name" in step
                assert "status" in step
    
    def test_get_task_with_evaluation_metrics(self):
        """Test that completed tasks have evaluation metrics"""
        response = requests.get(f"{BASE_URL}/api/tasks?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        completed_tasks = [t for t in data if t["status"] == "completed"]
        
        if len(completed_tasks) > 0:
            task = completed_tasks[0]
            evaluation = task["evaluation"]
            assert "quality_score" in evaluation
            assert "relevance_score" in evaluation
            assert "efficiency_score" in evaluation
            assert "overall_score" in evaluation
            # Verify scores are numeric
            assert isinstance(evaluation["overall_score"], (int, float))
    
    def test_get_single_task(self):
        """Test /api/tasks/{task_id} returns single task"""
        # First get a task ID
        list_response = requests.get(f"{BASE_URL}/api/tasks?limit=1")
        assert list_response.status_code == 200
        
        tasks = list_response.json()
        if len(tasks) > 0:
            task_id = tasks[0]["id"]
            response = requests.get(f"{BASE_URL}/api/tasks/{task_id}")
            assert response.status_code == 200
            
            task = response.json()
            assert task["id"] == task_id
    
    def test_get_nonexistent_task_returns_404(self):
        """Test /api/tasks/{task_id} returns 404 for nonexistent task"""
        response = requests.get(f"{BASE_URL}/api/tasks/nonexistent-task-id-12345")
        assert response.status_code == 404
    
    def test_create_task_and_verify_execution(self):
        """Test POST /api/tasks creates and executes a task"""
        payload = {
            "input_text": "TEST_task: Analyze this test input for API verification",
            "task_type": "general_analysis"
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=payload)
        assert response.status_code == 200
        
        task = response.json()
        assert task["input_text"] == payload["input_text"]
        assert task["status"] in ["completed", "failed"]
        assert "id" in task
        
        # Verify execution steps were created
        assert len(task["execution_steps"]) > 0
        
        # Verify evaluation metrics if completed
        if task["status"] == "completed":
            assert task["evaluation"]["overall_score"] > 0
            assert task["output"] is not None
            assert len(task["output"]) > 0
        
        # Cleanup - delete the test task
        delete_response = requests.delete(f"{BASE_URL}/api/tasks/{task['id']}")
        assert delete_response.status_code == 200


class TestEvalSuitesAPI:
    """Evaluation suites CRUD tests"""
    
    def test_get_eval_suites_list(self):
        """Test /api/eval/suites returns list"""
        response = requests.get(f"{BASE_URL}/api/eval/suites")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_eval_suite(self):
        """Test POST /api/eval/suites creates a suite"""
        payload = {
            "name": "TEST_API_Suite",
            "description": "Test suite created by API tests",
            "tasks": [
                {
                    "input_text": "Test task 1: Analyze this",
                    "expected_behavior": "Should provide analysis",
                    "task_type": "general_analysis",
                    "weight": 1.0
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/eval/suites", json=payload)
        assert response.status_code == 200
        
        suite = response.json()
        assert suite["name"] == payload["name"]
        assert suite["description"] == payload["description"]
        assert len(suite["tasks"]) == 1
        assert "id" in suite
        
        # Store suite_id for cleanup
        suite_id = suite["id"]
        
        # Verify we can get the suite
        get_response = requests.get(f"{BASE_URL}/api/eval/suites/{suite_id}")
        assert get_response.status_code == 200
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/eval/suites/{suite_id}")
        assert delete_response.status_code == 200
    
    def test_delete_nonexistent_suite_returns_404(self):
        """Test DELETE /api/eval/suites/{id} returns 404 for nonexistent"""
        response = requests.delete(f"{BASE_URL}/api/eval/suites/nonexistent-suite-id")
        assert response.status_code == 404


class TestEvalRunsAPI:
    """Evaluation runs tests"""
    
    def test_get_eval_runs_list(self):
        """Test /api/eval/runs returns list"""
        response = requests.get(f"{BASE_URL}/api/eval/runs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestMemoryAPI:
    """Memory service tests"""
    
    def test_get_memory_items(self):
        """Test /api/memory returns list"""
        response = requests.get(f"{BASE_URL}/api/memory")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_memory_stats(self):
        """Test /api/memory/stats returns stats"""
        response = requests.get(f"{BASE_URL}/api/memory/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_items" in data
        assert "by_type" in data


class TestSettingsAPI:
    """Settings endpoint tests"""
    
    def test_get_settings(self):
        """Test /api/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "default_provider" in data
        assert "default_model" in data
        assert "enable_persistence" in data
        assert "enable_memory" in data
    
    def test_update_settings(self):
        """Test PUT /api/settings updates settings"""
        # First get current settings
        get_response = requests.get(f"{BASE_URL}/api/settings")
        current_settings = get_response.json()
        
        # Update with same values (to not break anything)
        payload = {
            "id": "system_settings",
            "default_provider": current_settings.get("default_provider", "openai"),
            "default_model": current_settings.get("default_model", "gpt-5.2"),
            "enable_persistence": current_settings.get("enable_persistence", True),
            "enable_memory": current_settings.get("enable_memory", True),
            "enable_artifacts": current_settings.get("enable_artifacts", True),
            "max_input_size": current_settings.get("max_input_size", 50000),
            "theme": current_settings.get("theme", "dark"),
            "reduced_motion": current_settings.get("reduced_motion", False)
        }
        
        response = requests.put(f"{BASE_URL}/api/settings", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["default_model"] == payload["default_model"]


class TestExportAPI:
    """Export endpoint tests"""
    
    def test_export_task(self):
        """Test /api/export/task/{task_id} exports task data"""
        # First get a task ID
        list_response = requests.get(f"{BASE_URL}/api/tasks?limit=1")
        tasks = list_response.json()
        
        if len(tasks) > 0:
            task_id = tasks[0]["id"]
            response = requests.get(f"{BASE_URL}/api/export/task/{task_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["export_type"] == "task"
            assert "task" in data
            assert "memory_items" in data
            assert "export_timestamp" in data
    
    def test_export_nonexistent_task_returns_404(self):
        """Test /api/export/task/{task_id} returns 404 for nonexistent"""
        response = requests.get(f"{BASE_URL}/api/export/task/nonexistent-task-id")
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
