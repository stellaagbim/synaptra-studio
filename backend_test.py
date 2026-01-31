#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class SynaptraStudioAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_task_ids = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True, f"Status: {response.status_code}")
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")

            return success, response_data

        except requests.exceptions.Timeout:
            self.log_test(name, False, f"Request timed out after {timeout}s")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_system_status(self):
        """Test system status endpoint"""
        success, response = self.run_test(
            "System Status API",
            "GET",
            "status",
            200
        )
        
        if success:
            # Validate response structure
            required_fields = ['status', 'ai_engine', 'database', 'timestamp']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("System Status Response Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("System Status Response Structure", True, f"All required fields present")
                print(f"   Status: {response.get('status')}")
                print(f"   AI Engine: {response.get('ai_engine')}")
                print(f"   Database: {response.get('database')}")
                return True
        
        return False

    def test_create_task_text_only(self):
        """Test creating a task with text input only"""
        task_data = {
            "input_text": "Analyze this sample text for testing purposes. This is a comprehensive test to ensure the AI analysis pipeline works correctly.",
            "task_type": "text_summarization"
        }
        
        success, response = self.run_test(
            "Create Task (Text Only)",
            "POST",
            "tasks",
            200,
            data=task_data,
            timeout=60  # AI processing might take longer
        )
        
        if success:
            # Validate response structure
            required_fields = ['id', 'task_type', 'status', 'input_text', 'execution_steps']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Create Task Response Structure", False, f"Missing fields: {missing_fields}")
                return False, None
            
            task_id = response.get('id')
            self.created_task_ids.append(task_id)
            
            # Check if task has execution steps
            execution_steps = response.get('execution_steps', [])
            if len(execution_steps) != 5:
                self.log_test("Execution Steps Count", False, f"Expected 5 steps, got {len(execution_steps)}")
            else:
                self.log_test("Execution Steps Count", True, "5 execution steps created")
                
            # Check task status
            status = response.get('status')
            print(f"   Task Status: {status}")
            print(f"   Task ID: {task_id}")
            
            return True, task_id
        
        return False, None

    def test_get_tasks(self):
        """Test retrieving task list"""
        success, response = self.run_test(
            "Get Tasks List",
            "GET",
            "tasks",
            200
        )
        
        if success:
            if isinstance(response, list):
                self.log_test("Tasks List Format", True, f"Retrieved {len(response)} tasks")
                return True, response
            else:
                self.log_test("Tasks List Format", False, "Response is not a list")
                return False, []
        
        return False, []

    def test_get_specific_task(self, task_id):
        """Test retrieving a specific task by ID"""
        if not task_id:
            self.log_test("Get Specific Task", False, "No task ID provided")
            return False
            
        success, response = self.run_test(
            f"Get Task by ID ({task_id[:8]})",
            "GET",
            f"tasks/{task_id}",
            200
        )
        
        if success:
            if response.get('id') == task_id:
                self.log_test("Task ID Match", True, "Retrieved correct task")
                
                # Check if task has output (should be completed by now)
                if response.get('output'):
                    self.log_test("Task Output Generated", True, f"Output length: {len(response.get('output', ''))}")
                else:
                    self.log_test("Task Output Generated", False, "No output found")
                
                return True
            else:
                self.log_test("Task ID Match", False, f"Expected {task_id}, got {response.get('id')}")
        
        return False

    def test_delete_task(self, task_id):
        """Test deleting a task"""
        if not task_id:
            self.log_test("Delete Task", False, "No task ID provided")
            return False
            
        success, response = self.run_test(
            f"Delete Task ({task_id[:8]})",
            "DELETE",
            f"tasks/{task_id}",
            200
        )
        
        if success:
            # Verify task is actually deleted by trying to get it
            get_success, _ = self.run_test(
                f"Verify Task Deleted ({task_id[:8]})",
                "GET",
                f"tasks/{task_id}",
                404
            )
            return get_success
        
        return False

    def test_create_task_with_image(self):
        """Test creating a task with image (using a simple base64 encoded test image)"""
        # Simple 1x1 PNG image in base64
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        task_data = {
            "input_text": "Analyze this test image",
            "task_type": "image_analysis",
            "input_image_base64": test_image_base64
        }
        
        success, response = self.run_test(
            "Create Task (With Image)",
            "POST",
            "tasks",
            200,
            data=task_data,
            timeout=60
        )
        
        if success:
            task_id = response.get('id')
            if task_id:
                self.created_task_ids.append(task_id)
                self.log_test("Image Task Creation", True, f"Task ID: {task_id}")
                return True, task_id
        
        return False, None

    def cleanup_created_tasks(self):
        """Clean up tasks created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_task_ids)} created tasks...")
        
        for task_id in self.created_task_ids:
            try:
                response = requests.delete(f"{self.api_url}/tasks/{task_id}", timeout=10)
                if response.status_code == 200:
                    print(f"   ✅ Deleted task {task_id[:8]}")
                else:
                    print(f"   ❌ Failed to delete task {task_id[:8]}: {response.status_code}")
            except Exception as e:
                print(f"   ❌ Error deleting task {task_id[:8]}: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Synaptra Studio API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 60)

        try:
            # Test 1: System Status
            self.test_system_status()
            
            # Test 2: Create text task
            text_task_success, text_task_id = self.test_create_task_text_only()
            
            # Test 3: Get tasks list
            self.test_get_tasks()
            
            # Test 4: Get specific task (if we created one)
            if text_task_id:
                # Wait a moment for task processing
                time.sleep(2)
                self.test_get_specific_task(text_task_id)
            
            # Test 5: Create image task
            image_task_success, image_task_id = self.test_create_task_with_image()
            
            # Test 6: Delete task functionality
            if text_task_id:
                self.test_delete_task(text_task_id)
                # Remove from cleanup list since we already deleted it
                if text_task_id in self.created_task_ids:
                    self.created_task_ids.remove(text_task_id)

        except KeyboardInterrupt:
            print("\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error during testing: {str(e)}")
        finally:
            # Cleanup remaining tasks
            self.cleanup_created_tasks()

        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "   Success Rate: 0%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = SynaptraStudioAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())