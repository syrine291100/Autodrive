from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

import models
from database import SessionLocal
from main import app


client = TestClient(app)
TEST_EMAIL_SUFFIX = "@autodrive-ci.com"


def cleanup_test_data() -> None:
    with SessionLocal() as db:
        db.execute(
            delete(models.User).where(
                models.User.email.like(f"%{TEST_EMAIL_SUFFIX}")
            )
        )
        db.commit()


@pytest.fixture(autouse=True)
def clean_database():
    cleanup_test_data()
    yield
    cleanup_test_data()


def register_user(name: str, email: str, password: str = "Password123!") -> None:
    response = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 201, response.text


def login_user(email: str, password: str = "Password123!") -> str:
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_vehicle(token: str, registration: str) -> dict:
    response = client.post(
        "/vehicles",
        headers=auth_headers(token),
        json={
            "brand": "Toyota",
            "model": "Yaris",
            "year": 2022,
            "registration": registration,
            "mileage": 100000,
            "fuel_type": "Hybrid",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_health_endpoints() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}

    database = client.get("/health/database")
    assert database.status_code == 200
    assert database.json() == {
        "status": "ok",
        "database": "connected",
    }


def test_authentication_and_user_data_isolation() -> None:
    register_user("Alice", f"alice{TEST_EMAIL_SUFFIX}")
    register_user("Bob", f"bob{TEST_EMAIL_SUFFIX}")

    alice_token = login_user(f"alice{TEST_EMAIL_SUFFIX}")
    bob_token = login_user(f"bob{TEST_EMAIL_SUFFIX}")

    profile = client.get(
        "/auth/me",
        headers=auth_headers(alice_token),
    )
    assert profile.status_code == 200
    assert profile.json()["email"] == f"alice{TEST_EMAIL_SUFFIX}"

    vehicle = create_vehicle(alice_token, "TEST-ALICE-001")

    alice_vehicles = client.get(
        "/vehicles",
        headers=auth_headers(alice_token),
    )
    assert alice_vehicles.status_code == 200
    assert len(alice_vehicles.json()) == 1

    bob_vehicles = client.get(
        "/vehicles",
        headers=auth_headers(bob_token),
    )
    assert bob_vehicles.status_code == 200
    assert bob_vehicles.json() == []

    cross_user_access = client.get(
        f"/vehicles/{vehicle['id']}",
        headers=auth_headers(bob_token),
    )
    assert cross_user_access.status_code == 404

    unauthenticated = client.get("/vehicles")
    assert unauthenticated.status_code == 401


def test_vehicle_crud() -> None:
    register_user("CRUD User", f"crud{TEST_EMAIL_SUFFIX}")
    token = login_user(f"crud{TEST_EMAIL_SUFFIX}")

    vehicle = create_vehicle(token, "TEST-CRUD-001")
    vehicle_id = vehicle["id"]

    fetched = client.get(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers(token),
    )
    assert fetched.status_code == 200
    assert fetched.json()["registration"] == "TEST-CRUD-001"

    updated = client.put(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers(token),
        json={
            "brand": "Toyota",
            "model": "Yaris Cross",
            "year": 2023,
            "registration": "TEST-CRUD-001",
            "mileage": 101250,
            "fuel_type": "Hybrid",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["model"] == "Yaris Cross"
    assert updated.json()["mileage"] == 101250

    deleted = client.delete(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers(token),
    )
    assert deleted.status_code == 204

    missing = client.get(
        f"/vehicles/{vehicle_id}",
        headers=auth_headers(token),
    )
    assert missing.status_code == 404


def test_nested_resources_and_dashboard_aggregation() -> None:
    register_user("Dashboard User", f"dashboard{TEST_EMAIL_SUFFIX}")
    token = login_user(f"dashboard{TEST_EMAIL_SUFFIX}")
    headers = auth_headers(token)

    vehicle = create_vehicle(token, "TEST-DASH-001")
    vehicle_id = vehicle["id"]

    maintenance = client.post(
        f"/vehicles/{vehicle_id}/maintenances",
        headers=headers,
        json={
            "type": "Revision",
            "date": "2026-08-01",
            "mileage": 99500,
            "cost": "299.90",
            "notes": "Annual service",
        },
    )
    assert maintenance.status_code == 201, maintenance.text

    expense = client.post(
        f"/vehicles/{vehicle_id}/expenses",
        headers=headers,
        json={
            "category": "Fuel",
            "date": "2026-08-02",
            "amount": "75.10",
            "mileage": 99750,
            "notes": "Full tank",
        },
    )
    assert expense.status_code == 201, expense.text

    reminder = client.post(
        f"/vehicles/{vehicle_id}/reminders",
        headers=headers,
        json={
            "title": "Tyre check",
            "due_date": None,
            "due_mileage": 99000,
            "notes": "Check pressure and wear",
            "completed": False,
        },
    )
    assert reminder.status_code == 201, reminder.text

    invalid_reminder = client.post(
        f"/vehicles/{vehicle_id}/reminders",
        headers=headers,
        json={
            "title": "Invalid reminder",
            "due_date": None,
            "due_mileage": None,
            "notes": None,
            "completed": False,
        },
    )
    assert invalid_reminder.status_code == 400

    dashboard = client.get("/dashboard", headers=headers)
    assert dashboard.status_code == 200, dashboard.text

    data = dashboard.json()
    assert data["vehicles_count"] == 1
    assert data["expenses_count"] == 1
    assert data["maintenances_count"] == 1
    assert data["active_reminders"] == 1
    assert data["overdue_reminders"] == 1
    assert Decimal(str(data["total_expenses"])) == Decimal("75.10")
    assert Decimal(str(data["total_maintenance"])) == Decimal("299.90")
    assert Decimal(str(data["total_spending"])) == Decimal("375.00")

    assert data["expenses_by_category"][0]["category"] == "Fuel"
    assert Decimal(
        str(data["expenses_by_category"][0]["amount"])
    ) == Decimal("75.10")

    august = next(
        item
        for item in data["monthly_spending"]
        if item["month"] == "2026-08"
    )
    assert Decimal(str(august["expenses"])) == Decimal("75.10")
    assert Decimal(str(august["maintenance"])) == Decimal("299.90")
    assert Decimal(str(august["total"])) == Decimal("375.00")
