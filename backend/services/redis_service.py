# Persistent in-memory storage for local development
import threading
import json
import os

STORAGE_FILE = "job_storage.json"

class DummyRedis:
    def __init__(self):
        self.data = {}
        self.lock = threading.Lock()
        self._load()

    def _load(self):
        if os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE, 'r') as f:
                    raw_data = json.load(f)
                    # Convert back to bytes-like structure if needed, 
                    # but since we encode to utf-8 in hset, we can just store strings
                    self.data = raw_data
            except:
                self.data = {}

    def _save(self):
        try:
            with open(STORAGE_FILE, 'w') as f:
                json.dump(self.data, f)
        except:
            pass

    def hset(self, name, key=None, value=None, mapping=None):
        with self.lock:
            if name not in self.data:
                self.data[name] = {}
            
            if mapping:
                for k, v in mapping.items():
                    self.data[name][k] = str(v)
            elif key is not None and value is not None:
                self.data[name][key] = str(value)
            
            self._save()

    def hgetall(self, name):
        with self.lock:
            # The status route expects bytes-like keys/values or strings that it can decode
            # We'll return strings and ensure the routes can handle them
            res = self.data.get(name, {})
            return {k.encode('utf-8'): v.encode('utf-8') for k, v in res.items()}

# Replace the real redis client with our persistent dummy one
redis_client = DummyRedis()
