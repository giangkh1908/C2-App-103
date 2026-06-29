"""Unit tests for LLM budget alert.

MongoDB is mocked via ``unittest.mock`` following the same pattern
as ``test_admin_api.py``.
"""

from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.config import settings


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.llm_audit_logs = MagicMock()
    db.users = MagicMock()
    return db


@pytest.fixture
def mock_send_email():
    with patch("src.services.budget_alert.send_email", new_callable=AsyncMock) as mock:
        yield mock


def _patch_db(mock_db):
    stack = ExitStack()
    stack.enter_context(patch("src.core.database.db", mock_db))
    stack.enter_context(patch("src.services.budget_alert.get_db", return_value=mock_db))
    return stack


class TestCheckLlmBudget:
    @pytest.mark.asyncio
    async def test_sends_alert_when_budget_exceeded(self, mock_db, mock_send_email):
        """Gửi email cảnh báo khi chi phí vượt ngân sách."""
        mock_aggregate = AsyncMock()
        mock_aggregate.to_list = AsyncMock(return_value=[{"total": 2.0}])
        mock_db.llm_audit_logs.aggregate = MagicMock(return_value=mock_aggregate)

        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(
            return_value=[{"email": "admin@example.com"}, {"email": "admin2@example.com"}]
        )
        mock_db.users.find = MagicMock(return_value=mock_cursor)

        from src.services.budget_alert import check_llm_budget

        with _patch_db(mock_db):
            await check_llm_budget()

        assert mock_send_email.call_count == 2
        args, _ = mock_send_email.call_args
        assert "Cảnh báo ngân sách LLM" in args[1]
        assert "2.0000" in args[1]

    @pytest.mark.asyncio
    async def test_does_not_send_when_budget_ok(self, mock_db, mock_send_email):
        """Không gửi email khi chi phí trong ngân sách."""
        mock_aggregate = AsyncMock()
        mock_aggregate.to_list = AsyncMock(return_value=[{"total": 0.3}])
        mock_db.llm_audit_logs.aggregate = MagicMock(return_value=mock_aggregate)

        from src.services.budget_alert import check_llm_budget

        with _patch_db(mock_db):
            await check_llm_budget()

        mock_send_email.assert_not_called()

    @pytest.mark.asyncio
    async def test_skips_when_no_admins(self, mock_db, mock_send_email):
        """Bỏ qua khi không có admin user."""
        mock_aggregate = AsyncMock()
        mock_aggregate.to_list = AsyncMock(return_value=[{"total": 2.0}])
        mock_db.llm_audit_logs.aggregate = MagicMock(return_value=mock_aggregate)

        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[])
        mock_db.users.find = MagicMock(return_value=mock_cursor)

        from src.services.budget_alert import check_llm_budget

        with _patch_db(mock_db):
            await check_llm_budget()

        mock_send_email.assert_not_called()
