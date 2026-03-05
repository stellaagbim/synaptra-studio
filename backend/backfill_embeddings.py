"""
One-time script to generate vector embeddings for existing memory items
that were created before the RAG system was added.
"""

import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = "mongodb+srv://stella:Stellaisgreat1@cluster0.k7ff8ye.mongodb.net/?appName=Cluster0"
DB_NAME = os.environ.get('DB_NAME', 'synaptra_studio')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
EMBEDDING_MODEL = "text-embedding-3-small"


async def backfill():
    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not found in environment")
        return

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    # Find all memory items without embeddings
    items = await db.memory.find(
        {"$or": [{"embedding": None}, {"embedding": {"$exists": False}}]},
        {"_id": 0, "id": 1, "content": 1}
    ).to_list(1000)

    total = len(items)
    print(f"Found {total} memory items without embeddings")

    if total == 0:
        print("Nothing to backfill")
        client.close()
        return

    success = 0
    failed = 0

    for i, item in enumerate(items, 1):
        try:
            content = item.get("content", "")
            if not content:
                print(f"  [{i}/{total}] Skipping {item['id'][:8]} — empty content")
                failed += 1
                continue

            truncated = content[:32000]
            response = await openai_client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=truncated
            )
            embedding = response.data[0].embedding

            await db.memory.update_one(
                {"id": item["id"]},
                {"$set": {"embedding": embedding}}
            )
            success += 1
            print(f"  [{i}/{total}] Embedded {item['id'][:8]} ({len(embedding)} dims)")

        except Exception as e:
            failed += 1
            print(f"  [{i}/{total}] Failed {item['id'][:8]}: {e}")

        # Small delay to respect rate limits
        if i % 10 == 0:
            await asyncio.sleep(0.5)

    print(f"\nBackfill complete: {success} embedded, {failed} failed, {total} total")
    client.close()


if __name__ == "__main__":
    asyncio.run(backfill())
