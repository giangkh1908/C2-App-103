from src.core.logging import hash_user_id


class TestPIIScrubbing:
    """Unit tests for PII scrubbing helpers."""

    def test_hash_user_id_produces_short_hash(self):
        hashed = hash_user_id("user_507f1f77bcf86cd799439011")
        assert len(hashed) == 8
        assert hashed.isalnum()

    def test_hash_user_id_is_stable(self):
        user_id = "user_507f1f77bcf86cd799439011"
        assert hash_user_id(user_id) == hash_user_id(user_id)

    def test_hash_user_id_different_inputs_differ(self):
        assert hash_user_id("user_a") != hash_user_id("user_b")

    def test_hash_user_id_no_raw_id_in_hash(self):
        user_id = "user_507f1f77bcf86cd799439011"
        assert user_id not in hash_user_id(user_id)
