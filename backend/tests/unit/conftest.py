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


class _UnitMongoStub:
    """A pass-through stub for collection / db handles.

    Tests in this directory must not touch a real Mongo. The stub
    answers every `create_index` call with a fixed name, which is
    enough for the unit tests on hand.
    """

    def __getattr__(self, name):
        return _UnitMongoStub()

    async def create_index(self, *args, **kwargs):
        return "unit_stub_index"

    async def command(self, *args, **kwargs):
        return {"ok": 1}

    async def delete_many(self, *args, **kwargs):
        return None

    async def insert_one(self, *args, **kwargs):
        return None

    def close(self):
        return None


import pytest


@pytest.fixture
def mongo_client():
    """Mongo-free stub for unit tests."""
    return _UnitMongoStub()


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
