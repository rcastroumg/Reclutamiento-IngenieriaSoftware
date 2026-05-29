def bootstrap_candidate_with_application(client, auth_headers):
    company = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=auth_headers,
    ).json()
    scoped_headers = {**auth_headers, "X-Company-Id": str(company["id"])}

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Candidate Detail",
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
            "title": "Frontend Developer",
            "description": "Construir interfaces del panel.",
            "location": "Guatemala",
            "salary_min": 6000,
            "salary_max": 9000,
            "salary_frequency": "monthly",
            "salary_currency": "GTQ",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    candidate = client.post(
        "/candidates",
        json={"full_name": "Maria Lopez", "email": "maria@example.com"},
        headers=auth_headers,
    ).json()
    client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": position["id"], "notes": "Perfil fuerte"},
        headers=scoped_headers,
    )
    return auth_headers, candidate


def test_list_candidate_applications_returns_position_and_stage_snapshot(client, auth_headers):
    headers, candidate = bootstrap_candidate_with_application(client, auth_headers)

    response = client.get(f"/candidates/{candidate['id']}/applications", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["position"]["title"] == "Frontend Developer"
    assert response.json()[0]["current_stage"]["name"] == "Aplicado"
    assert response.json()[0]["notes"] == "Perfil fuerte"
