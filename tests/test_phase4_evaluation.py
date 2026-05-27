from tests.test_phase3_recruitment import bootstrap_company


def build_application(client, auth_headers):
    _, scoped_headers = bootstrap_company(client, auth_headers)
    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Evaluacion",
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
            "description": "Construir interfaces del portal de empleo.",
            "location": "Guatemala",
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
    application = client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": position["id"]},
        headers=scoped_headers,
    ).json()
    return scoped_headers, application


def test_questionnaire_can_be_created_and_assigned_to_application(client, auth_headers):
    scoped_headers, application = build_application(client, auth_headers)

    questionnaire = client.post(
        "/questionnaires",
        json={
            "name": "Filtro Tecnico",
            "questions": [
                {"prompt": "¿Cuantos años de experiencia tienes?", "order_index": 1},
                {"prompt": "¿Has trabajado con React?", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()

    assignment_response = client.post(
        "/questionnaire-assignments",
        json={"application_id": application["id"], "questionnaire_id": questionnaire["id"]},
        headers=scoped_headers,
    )

    assert assignment_response.status_code == 201
    assert assignment_response.json()["application_id"] == application["id"]
    assert assignment_response.json()["status"] == "pending"


def test_scorecard_template_can_be_submitted_for_application(client, auth_headers):
    scoped_headers, application = build_application(client, auth_headers)

    template = client.post(
        "/scorecards/templates",
        json={
            "name": "Entrevista Tecnica",
            "criteria": [
                {"name": "Comunicacion", "order_index": 1},
                {"name": "Arquitectura", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()

    scorecard_response = client.post(
        "/scorecards",
        json={
            "application_id": application["id"],
            "scorecard_template_id": template["id"],
            "items": [
                {"criterion_id": template["criteria"][0]["id"], "score": 4, "comment": "Buena comunicacion"},
                {"criterion_id": template["criteria"][1]["id"], "score": 5, "comment": "Muy buena base tecnica"},
            ],
        },
        headers=scoped_headers,
    )

    assert scorecard_response.status_code == 201
    assert scorecard_response.json()["application_id"] == application["id"]
    assert len(scorecard_response.json()["items"]) == 2


def test_scorecard_requires_all_template_criteria(client, auth_headers):
    scoped_headers, application = build_application(client, auth_headers)

    template = client.post(
        "/scorecards/templates",
        json={
            "name": "Entrevista Inicial",
            "criteria": [
                {"name": "Comunicacion", "order_index": 1},
                {"name": "Cultura", "order_index": 2},
            ],
        },
        headers=scoped_headers,
    ).json()

    response = client.post(
        "/scorecards",
        json={
            "application_id": application["id"],
            "scorecard_template_id": template["id"],
            "items": [
                {"criterion_id": template["criteria"][0]["id"], "score": 4},
            ],
        },
        headers=scoped_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Scorecard items must match template criteria exactly"
