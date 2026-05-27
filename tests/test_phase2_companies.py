from models.recruitment import MembershipRole


def test_create_company_assigns_admin_membership(client, auth_headers):
    headers = auth_headers

    response = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["slug"] == "recruitment-solutions"

    memberships_response = client.get("/companies/mine", headers=headers)

    assert memberships_response.status_code == 200
    assert len(memberships_response.json()) == 1
    assert memberships_response.json()[0]["role"] == MembershipRole.admin.value


def test_get_company_requires_membership(client):
    client.post(
        "/auth/register",
        json={"full_name": "Owner User", "email": "owner@example.com", "password": "Super1234"},
    )
    client.post(
        "/auth/register",
        json={"full_name": "Outsider User", "email": "outsider@example.com", "password": "Super1234"},
    )

    owner_token = client.post(
        "/auth/login",
        json={"email": "owner@example.com", "password": "Super1234"},
    ).json()["access_token"]
    outsider_token = client.post(
        "/auth/login",
        json={"email": "outsider@example.com", "password": "Super1234"},
    ).json()["access_token"]

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    company_response = client.post(
        "/companies",
        json={"name": "Company A", "slug": "company-a"},
        headers=owner_headers,
    )
    company_id = company_response.json()["id"]

    response = client.get(f"/companies/{company_id}", headers=outsider_headers)

    assert response.status_code == 404


def test_active_company_header_is_required_for_scoped_endpoints(client, auth_headers):
    headers = auth_headers
    client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=headers,
    )

    response = client.get("/pipelines", headers=headers)

    assert response.status_code == 400
    assert response.json()["detail"] == "X-Company-Id header is required"
