import uuid
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta

mongo_url = "mongodb+srv://stella:Stellaisgreat1@cluster0.k7ff8ye.mongodb.net/?appName=Cluster0"

try:
    print("Connecting to database...")
    client = MongoClient(mongo_url)
    
    # Connect to the correct database
    db = client.get_database('synaptra_studio')
    
    print("Connected. Clearing old mock data...")
    db.tasks.delete_many({})
    db.eval_runs.delete_many({})

    print("Seeding new mock tasks...")
    tasks = [
        {
            "id": str(uuid.uuid4()),
            "task_type": "text_summarization",
            "status": "completed",
            "input_text": "Analyze the quarterly financial report for Q3 2024...",
            "output": "The Q3 report indicates a 15% growth in revenue driven by AI sector adoption...",
            "created_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "execution_steps": [
                {"name": "Input Reception", "status": "completed", "duration_ms": 50},
                {"name": "AI Analysis", "status": "completed", "duration_ms": 1200}
            ],
            "evaluation": {
                "quality_score": 92.5,
                "relevance_score": 95.0,
                "efficiency_score": 88.0,
                "overall_score": 91.8
            },
            "metadata": {"model_used": "gpt-4o", "processing_time_ms": 1250}
        },
        {
            "id": str(uuid.uuid4()),
            "task_type": "code_analysis",
            "status": "completed",
            "input_text": "def calculate_primes(n): ...",
            "output": "The function implements the Sieve of Eratosthenes efficiently...",
            "created_at": (datetime.now(timezone.utc) - timedelta(minutes=20)).isoformat(),
            "completed_at": (datetime.now(timezone.utc) - timedelta(minutes=19)).isoformat(),
            "execution_steps": [],
            "evaluation": {
                "quality_score": 85.0,
                "relevance_score": 100.0,
                "efficiency_score": 90.0,
                "overall_score": 91.6
            },
            "metadata": {"model_used": "gpt-4o", "processing_time_ms": 800}
        },
        {
            "id": str(uuid.uuid4()),
            "task_type": "image_analysis",
            "status": "failed",
            "input_text": "Analyze this architectural blueprint",
            "error_message": "Image format not supported",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "execution_steps": [],
            "evaluation": {"overall_score": 0},
            "metadata": {"model_used": "gpt-4-vision"}
        }
    ]

    db.tasks.insert_many(tasks)
    
    print(f"SUCCESS. Seeded {len(tasks)} tasks.")
    print("Refresh your Dashboard now.")

except Exception as e:
    print(f"Connection failed: {e}")