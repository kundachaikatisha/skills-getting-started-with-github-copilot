"""
Tests for the Mergington High School API endpoints.
"""

import copy
import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

# Snapshot of the original activities state so we can restore it after each test
_original_activities = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities database between tests."""
    yield
    activities.clear()
    activities.update(copy.deepcopy(_original_activities))


@pytest.fixture()
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# GET /activities
# ---------------------------------------------------------------------------

class TestGetActivities:
    def test_returns_all_activities(self, client):
        response = client.get("/activities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Verify a few known activities exist
        assert "Chess Club" in data
        assert "Basketball Team" in data
        assert "Programming Class" in data

    def test_activity_has_expected_fields(self, client):
        response = client.get("/activities")
        data = response.json()
        activity = data["Chess Club"]
        assert "description" in activity
        assert "schedule" in activity
        assert "max_participants" in activity
        assert "participants" in activity

    def test_activity_participants_are_lists(self, client):
        response = client.get("/activities")
        data = response.json()
        for name, details in data.items():
            assert isinstance(details["participants"], list), (
                f"{name} participants should be a list"
            )


# ---------------------------------------------------------------------------
# POST /activities/{activity_name}/signup
# ---------------------------------------------------------------------------

class TestSignup:
    def test_signup_success(self, client):
        email = "newstudent@mergington.edu"
        response = client.post(
            "/activities/Chess Club/signup",
            params={"email": email},
        )
        assert response.status_code == 200
        assert email in response.json()["message"]

        # Verify participant appears in the activity list
        act = client.get("/activities").json()
        assert email in act["Chess Club"]["participants"]

    def test_signup_duplicate_email(self, client):
        email = "michael@mergington.edu"  # already in Chess Club
        response = client.post(
            "/activities/Chess Club/signup",
            params={"email": email},
        )
        assert response.status_code == 400
        assert "already signed up" in response.json()["detail"].lower()

    def test_signup_nonexistent_activity(self, client):
        response = client.post(
            "/activities/Nonexistent Activity/signup",
            params={"email": "test@mergington.edu"},
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# DELETE /activities/{activity_name}/unregister
# ---------------------------------------------------------------------------

class TestUnregister:
    def test_unregister_success(self, client):
        email = "michael@mergington.edu"  # currently in Chess Club
        response = client.delete(
            "/activities/Chess Club/unregister",
            params={"email": email},
        )
        assert response.status_code == 200
        assert "Unregistered" in response.json()["message"]

        # Confirm participant is removed
        act = client.get("/activities").json()
        assert email not in act["Chess Club"]["participants"]

    def test_unregister_not_registered(self, client):
        email = "nobody@mergington.edu"
        response = client.delete(
            "/activities/Chess Club/unregister",
            params={"email": email},
        )
        assert response.status_code == 400
        assert "not registered" in response.json()["detail"].lower()

    def test_unregister_nonexistent_activity(self, client):
        response = client.delete(
            "/activities/Nonexistent Activity/unregister",
            params={"email": "test@mergington.edu"},
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# GET / (redirect)
# ---------------------------------------------------------------------------

class TestRoot:
    def test_root_redirects(self, client):
        response = client.get("/", follow_redirects=False)
        assert response.status_code in (301, 302, 307)
        assert "/static/index.html" in response.headers["location"]
