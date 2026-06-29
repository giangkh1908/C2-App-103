import pytest


@pytest.fixture(autouse=True)
def patched_practice_catalog():
    yield
