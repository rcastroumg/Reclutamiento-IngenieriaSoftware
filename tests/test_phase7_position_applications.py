def bootstrap_position_with_application(client, auth_headers):
    company = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=auth_headers,
    ).json()
    scoped_headers = {**auth_headers, "X-Company-Id": str(company["id"])}

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Seguimiento",
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
            "description": "APIs y procesos internos.",
            "location": "Guatemala",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    candidate = client.post(
        "/candidates",
        json={"full_name": "Ana Perez", "email": "ana@example.com"},
        headers=auth_headers,
    ).json()
    application = client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": position["id"]},
        headers=scoped_headers,
    ).json()
    return scoped_headers, position, application


def test_list_position_applications_returns_candidate_and_stage_snapshot(client, auth_headers):
    scoped_headers, position, application = bootstrap_position_with_application(client, auth_headers)

    response = client.get(f"/positions/{position['id']}/applications", headers=scoped_headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == application["id"]
    assert response.json()[0]["candidate"]["full_name"] == "Ana Perez"
    assert response.json()[0]["current_stage"]["name"] == "Aplicado"
