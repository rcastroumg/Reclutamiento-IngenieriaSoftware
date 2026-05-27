def bootstrap_public_position(client, auth_headers):
    company = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=auth_headers,
    ).json()
    scoped_headers = {**auth_headers, "X-Company-Id": str(company["id"])}
    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Publico",
            "stages": [
                {"name": "Aplicado", "order_index": 1},
                {"name": "Filtro", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()
    position = client.post(
        "/positions",
        json={
            "title": "Fullstack Developer",
            "description": "Construir backend y frontend del portal.",
            "location": "Guatemala",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    published = client.post(f"/positions/{position['id']}/publish", headers=scoped_headers).json()
    return scoped_headers, pipeline, published


def test_public_jobs_list_only_published_positions(client, auth_headers):
    _, _, published = bootstrap_public_position(client, auth_headers)

    jobs_response = client.get("/public/jobs")

    assert jobs_response.status_code == 200
    assert len(jobs_response.json()) == 1
    assert jobs_response.json()[0]["id"] == published["id"]


def test_public_application_creates_candidate_and_application(client, auth_headers):
    _, pipeline, published = bootstrap_public_position(client, auth_headers)

    apply_response = client.post(
        f"/public/jobs/{published['id']}/apply",
        json={
            "full_name": "Paula Diaz",
            "email": "paula@example.com",
            "phone": "5555-2222",
            "summary": "Fullstack engineer",
            "notes": "Interesada en el puesto",
        },
    )

    assert apply_response.status_code == 201
    assert apply_response.json()["current_stage_id"] == pipeline["stages"][0]["id"]
    assert len(apply_response.json()["stage_history"]) == 1


def test_public_application_rejects_duplicate_candidate_for_same_position(client, auth_headers):
    _, _, published = bootstrap_public_position(client, auth_headers)

    payload = {
        "full_name": "Paula Diaz",
        "email": "paula@example.com",
        "phone": "5555-2222",
    }
    first_response = client.post(f"/public/jobs/{published['id']}/apply", json=payload)
    second_response = client.post(f"/public/jobs/{published['id']}/apply", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Candidate already applied to this position"
