from models.recruitment import User


def test_register_and_login_returns_bearer_token(client):
    register_response = client.post(
        "/auth/register",
        json={
            "full_name": "Roberto Castro",
            "email": "roberto@example.com",
            "password": "Strong1234",
        },
    )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == "roberto@example.com"

    login_response = client.post(
        "/auth/login",
        json={"email": "roberto@example.com", "password": "Strong1234"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["token_type"] == "bearer"
    assert login_response.json()["access_token"]


def test_register_hashes_password(client, db_session):
    client.post(
        "/auth/register",
        json={
            "full_name": "Roberto Castro",
            "email": "roberto@example.com",
            "password": "Strong1234",
        },
    )

    user = db_session.query(User).filter(User.email == "roberto@example.com").first()

    assert user is not None
    assert user.hashed_password != "Strong1234"


def test_login_rejects_invalid_credentials(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Roberto Castro",
            "email": "roberto@example.com",
            "password": "Strong1234",
        },
    )

    login_response = client.post(
        "/auth/login",
        json={"email": "roberto@example.com", "password": "BadPassword"},
    )

    assert login_response.status_code == 401
    assert login_response.json()["detail"] == "Invalid credentials"


def test_cors_preflight_allows_frontend_login_request(client):
    response = client.options(
        "/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_login_response_uses_explicit_origin(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Roberto Castro",
            "email": "roberto@example.com",
            "password": "Strong1234",
        },
    )

    response = client.post(
        "/auth/login",
        headers={"Origin": "http://localhost:5173"},
        json={"email": "roberto@example.com", "password": "Strong1234"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
