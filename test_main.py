from fastapi.testclient import TestClient
from main import app
import json
import os

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_queue_status():
    response = client.get("/api/queue")
    assert response.status_code == 200
    data = response.json()
    assert "remaining" in data

def test_rss_crud():
    # Cleanup any existing test feed
    client.delete("/api/rss?url=https://test.com/rss")
    
    # 1. Add RSS feed
    payload = {
        "url": "https://test.com/rss",
        "tag": "test-tag",
        "keywords": ["test1", "test2"]
    }
    response = client.post("/api/rss", json=payload)
    assert response.status_code == 201
    
    # 2. Get RSS feeds and verify
    response = client.get("/api/rss")
    assert response.status_code == 200
    data = response.json()
    feeds = data.get("feeds", [])
    
    # Find our test feed
    found = False
    for feed in feeds:
        if feed["url"] == "https://test.com/rss":
            found = True
            assert feed["tag"] == "test-tag"
            assert "test1" in feed["keywords"]
            break
    assert found
    
    # 3. Delete RSS feed
    response = client.delete("/api/rss?url=https://test.com/rss")
    assert response.status_code == 200
    
    # 4. Verify deletion
    response = client.get("/api/rss")
    feeds = response.json().get("feeds", [])
    assert not any(f["url"] == "https://test.com/rss" for f in feeds)

def test_search_api():
    # Test search with an arbitrary query (should return 200 even if empty)
    response = client.get("/api/search?q=test")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
