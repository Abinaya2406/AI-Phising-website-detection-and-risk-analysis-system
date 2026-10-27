"""MongoDB Connection Manager and Repository Layer for PhishGuard AI."""
import time
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.utils.logger import logger

class InMemoryCollection:
    """In-memory collection emulator used when MongoDB server is not active or during testing."""
    def __init__(self, name: str):
        self.name = name
        self.documents: List[Dict[str, Any]] = []

    def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(len(self.documents) + 1)
        self.documents.append(doc_copy)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    def find_one(self, filter_query: Optional[Dict[str, Any]] = None, sort=None) -> Optional[Dict[str, Any]]:
        filter_query = filter_query or {}
        matches = [d for d in self.documents if self._matches(d, filter_query)]
        if not matches:
            return None
        if sort:
            key, direction = sort[0]
            matches.sort(key=lambda x: x.get(key, 0), reverse=(direction < 0))
        return dict(matches[0])

    def find(self, filter_query: Optional[Dict[str, Any]] = None, sort=None, limit: int = 0) -> List[Dict[str, Any]]:
        filter_query = filter_query or {}
        matches = [dict(d) for d in self.documents if self._matches(d, filter_query)]
        if sort:
            key, direction = sort[0]
            matches.sort(key=lambda x: x.get(key, 0), reverse=(direction < 0))
        if limit > 0:
            matches = matches[:limit]
        return matches

    def update_one(self, filter_query: Dict[str, Any], update_doc: Dict[str, Any]):
        doc = self.find_one(filter_query)
        if doc:
            for item in self.documents:
                if self._matches(item, filter_query):
                    if "$set" in update_doc:
                        item.update(update_doc["$set"])
                    break

    def delete_one(self, filter_query: Dict[str, Any]):
        for idx, item in enumerate(self.documents):
            if self._matches(item, filter_query):
                del self.documents[idx]
                return True
        return False

    def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(filter_query))

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v) and str(doc.get("id")) != str(v):
                    return False
            elif doc.get(k) != v:
                return False
        return True


class InMemoryDatabase:
    """In-memory DB substitute supporting dict attribute access for collections."""
    def __init__(self, name: str = "phishguard_fallback_db"):
        self.name = name
        self._collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, item: str) -> InMemoryCollection:
        if item not in self._collections:
            self._collections[item] = InMemoryCollection(item)
        return self._collections[item]

    def __getattr__(self, item: str) -> InMemoryCollection:
        return self[item]


class DatabaseManager:
    """Manages active MongoDB connection with automatic fallback."""
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db: Any = None
        self.is_connected: bool = False
        self.is_mock: bool = False

    def init_app(self, app):
        mongo_uri = app.config.get("MONGO_URI", "mongodb://localhost:27017/phishguard_db")
        db_name = app.config.get("MONGO_DB_NAME", "phishguard_db")

        try:
            # 1.5s timeout for fast failover if MongoDB daemon is not running
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1500)
            self.client.admin.command("ping")
            self.db = self.client[db_name]
            self.is_connected = True
            self.is_mock = False
            logger.info(f"Successfully connected to MongoDB at {mongo_uri} (Database: '{db_name}')")
            self._ensure_indexes()
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.warning(
                f"Could not connect to external MongoDB server ({e}). Falling back to in-memory repository."
            )
            self.client = None
            self.db = InMemoryDatabase(db_name)
            self.is_connected = False
            self.is_mock = True

    def _ensure_indexes(self):
        """Create required indexes for fast queries and uniqueness constraints."""
        if self.is_connected and self.db is not None:
            try:
                self.db.scan_history.create_index("url")
                self.db.scan_history.create_index("created_at")
                self.db.monitoring_configs.create_index("url")
                self.db.alerts.create_index("created_at")
                self.db.website_change_history.create_index("target_id")
            except Exception as e:
                logger.warning(f"Index creation notice: {e}")

    def get_collection(self, collection_name: str):
        """Return the requested collection."""
        return self.db[collection_name]

    def close(self):
        if self.client:
            self.client.close()
            self.is_connected = False


db_manager = DatabaseManager()

