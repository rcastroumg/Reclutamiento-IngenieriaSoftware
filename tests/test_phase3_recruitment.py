def bootstrap_company(client, auth_headers):
    company_response = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=auth_headers,
    )
    company_id = company_response.json()["id"]
    scoped_headers = {**auth_headers, "X-Company-Id": str(company_id)}
    return company_id, scoped_headers


def test_admin_can_create_pipeline_with_stages(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    response = client.post(
        "/pipelines",
        json={
            "name": "Pipeline General",
            "is_default": True,
            "stages": [
                {"name": "Aplicado", "order_index": 1},
                {"name": "Entrevista", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    )

    assert response.status_code == 201
    assert response.json()["is_default"] is True
    assert len(response.json()["stages"]) == 2


def test_recruitment_flow_creates_position_candidate_application_and_stage_history(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    pipeline_response = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Tech",
            "is_default": True,
            "stages": [
                {"name": "Aplicado", "order_index": 1},
                {"name": "Filtro", "order_index": 2},
                {"name": "Entrevista", "order_index": 3},
            ],
        },
        headers=scoped_headers,
    )
    pipeline = pipeline_response.json()

    position_response = client.post(
        "/positions",
        json={
            "title": "Backend Developer",
            "description": "Implementar APIs y reglas de negocio para reclutamiento.",
            "location": "Guatemala",
            "salary_min": 5000,
            "salary_max": 8000,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    )
    position = position_response.json()

    candidate_response = client.post(
        "/candidates",
        json={
            "full_name": "Ana Perez",
            "email": "ana@example.com",
            "phone": "5555-1111",
            "summary": "Backend engineer",
        },
        headers=auth_headers,
    )
    candidate = candidate_response.json()

    application_response = client.post(
        "/applications",
        json={
            "candidate_id": candidate["id"],
            "position_id": position["id"],
            "notes": "CV recibido",
        },
        headers=scoped_headers,
    )
    application = application_response.json()

    assert application_response.status_code == 201
    assert application["position_id"] == position["id"]
    assert application["candidate_id"] == candidate["id"]
    assert application["current_stage_id"] == pipeline["stages"][0]["id"]
    assert len(application["stage_history"]) == 1
    assert application["stage_history"][0]["from_stage_id"] is None
    assert application["stage_history"][0]["to_stage_id"] == pipeline["stages"][0]["id"]

    move_response = client.post(
        f"/applications/{application['id']}/move-stage",
        json={"stage_id": pipeline["stages"][1]["id"]},
        headers=scoped_headers,
    )
    moved_application = move_response.json()

    assert move_response.status_code == 200
    assert moved_application["current_stage_id"] == pipeline["stages"][1]["id"]
    assert len(moved_application["stage_history"]) == 2
    assert moved_application["stage_history"][1]["from_stage_id"] == pipeline["stages"][0]["id"]
    assert moved_application["stage_history"][1]["to_stage_id"] == pipeline["stages"][1]["id"]


def test_application_cannot_move_to_stage_from_another_pipeline(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    pipeline_a = client.post(
        "/pipelines",
        json={
            "name": "Pipeline A",
            "stages": [
                {"name": "Aplicado", "order_index": 1},
                {"name": "Entrevista", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()
    pipeline_b = client.post(
        "/pipelines",
        json={
            "name": "Pipeline B",
            "stages": [
                {"name": "Inicial", "order_index": 1},
                {"name": "Final", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()

    position = client.post(
        "/positions",
        json={
            "title": "QA Engineer",
            "description": "Validar calidad del sistema.",
            "location": "Remoto",
            "salary_min": 7000,
            "salary_max": 9500,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline_a["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    candidate = client.post(
        "/candidates",
        json={"full_name": "Luis Gomez", "email": "luis@example.com"},
        headers=auth_headers,
    ).json()
    application = client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": position["id"]},
        headers=scoped_headers,
    ).json()

    response = client.post(
        f"/applications/{application['id']}/move-stage",
        json={"stage_id": pipeline_b["stages"][0]["id"]},
        headers=scoped_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Stage does not belong to the position pipeline"


def test_can_edit_position_without_changing_pipeline(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Tech",
            "stages": [
                {"name": "Aplicado", "order_index": 1},
                {"name": "Entrevista", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()

    position = client.post(
        "/positions",
        json={
            "title": "Backend Developer",
            "description": "Implementar APIs y reglas de negocio para reclutamiento.",
            "location": "Guatemala",
            "salary_min": 5000,
            "salary_max": 8000,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()

    response = client.patch(
        f"/positions/{position['id']}",
        json={
            "title": "Senior Backend Developer",
            "description": "Implementar APIs, integraciones y reglas de negocio complejas.",
            "location": "Remoto",
            "salary_min": 9000,
            "salary_max": 12000,
            "salary_frequency": "monthly",
            "salary_currency": "USD",
            "status": "closed",
        },
        headers=scoped_headers,
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Senior Backend Developer"
    assert response.json()["location"] == "Remoto"
    assert response.json()["status"] == "closed"
    assert response.json()["salary_min"] == 9000
    assert response.json()["salary_max"] == 12000
    assert response.json()["salary_frequency"] == "monthly"
    assert response.json()["salary_currency"] == "USD"
    assert response.json()["pipeline_id"] == pipeline["id"]
    assert response.json()["is_public"] is False


def test_delete_position_removes_it_when_it_has_no_applications(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Tech",
            "stages": [{"name": "Aplicado", "order_index": 1}],
        },
        headers=scoped_headers,
    ).json()

    position = client.post(
        "/positions",
        json={
            "title": "Backend Developer",
            "description": "Implementar APIs y reglas de negocio para reclutamiento.",
            "location": "Guatemala",
            "salary_min": 5000,
            "salary_max": 8000,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline["id"],
            "status": "draft",
        },
        headers=scoped_headers,
    ).json()

    response = client.delete(f"/positions/{position['id']}", headers=scoped_headers)
    positions_response = client.get("/positions", headers=scoped_headers)

    assert response.status_code == 204
    assert positions_response.status_code == 200
    assert positions_response.json() == []


def test_delete_position_closes_and_unpublishes_it_when_it_has_applications(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Tech",
            "stages": [
                {"name": "Aplicado", "order_index": 1},
                {"name": "Entrevista", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()

    position = client.post(
        "/positions",
        json={
            "title": "Backend Developer",
            "description": "Implementar APIs y reglas de negocio para reclutamiento.",
            "location": "Guatemala",
            "salary_min": 5000,
            "salary_max": 8000,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    published = client.post(f"/positions/{position['id']}/publish", headers=scoped_headers).json()
    candidate = client.post(
        "/candidates",
        json={"full_name": "Ana Perez", "email": "ana@example.com"},
        headers=auth_headers,
    ).json()
    client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": published["id"]},
        headers=scoped_headers,
    )

    response = client.delete(f"/positions/{published['id']}", headers=scoped_headers)
    public_jobs_response = client.get("/public/jobs")

    assert response.status_code == 200
    assert response.json()["status"] == "closed"
    assert response.json()["is_public"] is False
    assert public_jobs_response.status_code == 200
    assert public_jobs_response.json() == []


def test_position_rejects_invalid_salary_range(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Tech",
            "stages": [{"name": "Aplicado", "order_index": 1}],
        },
        headers=scoped_headers,
    ).json()

    response = client.post(
        "/positions",
        json={
            "title": "Backend Developer",
            "description": "Implementar APIs y reglas de negocio para reclutamiento.",
            "location": "Guatemala",
            "salary_min": 9000,
            "salary_max": 7000,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    )

    assert response.status_code == 422
    assert "salary_max" in str(response.json())
