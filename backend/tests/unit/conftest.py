"""Unit-test-local conftest.

The repo-level `tests/conftest.py` declares an autouse fixture
`patched_practice_catalog` that depends (via `seeded_practice_data` ->
`mock_db` -> `mongo_client`) on a live MongoDB at 127.0.0.1:27018.
That is correct for integration / API tests but it forces every
unit test in this directory to also require a running Mongo,
which is wrong: pure model / utility tests must run without it.

We override `mongo_client`, `mock_db`, and the autouse catalog
fixture here with Mongo-free versions. Integration tests live in
`tests/integration/` and are unaffected — they still see the
original fixtures.
"""

from bson import ObjectId


class _InsertResult:
    """Mimics pymongo InsertOneResult so that `result.inserted_id` works."""

    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _UnitMongoCollection:
    """In-memory collection stub — stores documents so find/insert/update
    behave like a real Mongo collection within a single test."""

    _store: dict[str, list[dict]] = {}  # collection name -> list of docs

    def __init__(self, name: str):
        self._name = name

    # -- helpers ----------------------------------------------------------------

    def _docs(self) -> list[dict]:
        return _UnitMongoCollection._store.setdefault(self._name, [])

    @staticmethod
    def _matches(doc: dict, filter: dict | None) -> bool:
        if filter is None:
            return True
        for key, value in filter.items():
            dv = doc.get(key)
            if isinstance(value, dict):
                # Simple $gt support for expiry checks
                if "$gt" in value:
                    if not (dv and dv > value["$gt"]):
                        return False
                elif "$ne" in value:
                    if dv == value["$ne"]:
                        return False
                else:
                    # Unknown operator — fall back to equality
                    if dv != value.get("$eq", value):
                        return False
            else:
                # Treat ObjectId and string representations as equal for _id
                if key == "_id":
                    if str(dv) != str(value):
                        return False
                elif dv != value:
                    return False
        return True

    # -- collection-like async methods ------------------------------------------

    async def create_index(self, *args, **kwargs):
        return "unit_stub_index"

    async def delete_many(self, *args, **kwargs):
        self._docs().clear()

    async def insert_one(self, doc):
        doc = {**doc}
        doc.setdefault("_id", ObjectId())
        self._docs().append(doc)
        return _InsertResult(doc["_id"])

    async def find_one(self, filter=None) -> dict | None:
        for doc in self._docs():
            if self._matches(doc, filter):
                return {**doc}
        return None

    async def update_one(self, filter, update):
        for doc in self._docs():
            if self._matches(doc, filter):
                set_data = update.get("$set", {})
                doc.update(set_data)
                return None
        return None

    async def find(self, filter=None):
        return [{**d} for d in self._docs()]


class _UnitMongoDb:
    """Mongo-free stub that returns a named collection on attribute access."""

    def __getattr__(self, name):
        # Return a collection stub whose in-memory store is keyed by name.
        # Use the exact name so `db.users` and `db.sessions` stay separate.
        return _UnitMongoCollection(name)

    async def create_index(self, *args, **kwargs):
        return "unit_stub_index"

    async def command(self, *args, **kwargs):
        return {"ok": 1}

    async def delete_many(self, *args, **kwargs):
        # Clear every collection in the shared store
        _UnitMongoCollection._store.clear()

    def close(self):
        return None


import pytest


@pytest.fixture(autouse=True)
def _reset_mongo_store():
    """Clear in-memory document store before each test."""
    _UnitMongoCollection._store.clear()


@pytest.fixture
def mongo_client():
    """Mongo-free stub for unit tests."""
    return _UnitMongoDb()


@pytest.fixture
def mock_db(mongo_client):
    """Mongo-free stub db for unit tests."""
    return mongo_client


@pytest.fixture(autouse=True)
def patched_practice_catalog_unit():
    """No-op stand-in for the integration autouse fixture.

    The full practice catalog is only required by tests that exercise
    the `/practice` API. Unit tests touching models, utilities and
    helpers do not need it.
    """
    yield
