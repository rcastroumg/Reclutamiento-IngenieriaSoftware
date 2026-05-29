def bootstrap_application_for_evaluation(client, auth_headers):
    company = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=auth_headers,
    ).json()
    scoped_headers = {**auth_headers, "X-Company-Id": str(company["id"])}

    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Evaluation UI",
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
            "title": "UX Engineer",
            "description": "Disenar y construir interfaces.",
            "location": "Guatemala",
            "salary_min": 7000,
            "salary_max": 11000,
            "salary_frequency": "monthly",
            "salary_currency": "USD",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    candidate = client.post(
        "/candidates",
        json={"full_name": "Nora Silva", "email": "nora@example.com"},
        headers=auth_headers,
    ).json()
    application = client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": position["id"]},
        headers=scoped_headers,
    ).json()
    return scoped_headers, application


def test_evaluation_query_endpoints_return_company_scoped_data(client, auth_headers):
    scoped_headers, application = bootstrap_application_for_evaluation(client, auth_headers)

    questionnaire = client.post(
        "/questionnaires",
        json={
            "name": "Filtro Inicial",
            "questions": [{"prompt": "Cuanta experiencia tienes?", "order_index": 1}],
        },
        headers=scoped_headers,
    ).json()
    template = client.post(
        "/scorecards/templates",
        json={
            "name": "Entrevista UX",
            "criteria": [{"name": "Empatia", "order_index": 1}],
        },
        headers=scoped_headers,
    ).json()
    client.post(
        "/questionnaire-assignments",
        json={"application_id": application["id"], "questionnaire_id": questionnaire["id"]},
        headers=scoped_headers,
    )
    client.post(
        "/scorecards",
        json={
            "application_id": application["id"],
            "scorecard_template_id": template["id"],
            "items": [{"criterion_id": template["criteria"][0]["id"], "score": 5, "comment": "Muy bien"}],
        },
        headers=scoped_headers,
    )

    questionnaires_response = client.get("/questionnaires", headers=scoped_headers)
    assignments_response = client.get(f"/applications/{application['id']}/questionnaire-assignments", headers=scoped_headers)
    templates_response = client.get("/scorecards/templates", headers=scoped_headers)
    scorecards_response = client.get(f"/applications/{application['id']}/scorecards", headers=scoped_headers)

    assert questionnaires_response.status_code == 200
    assert questionnaires_response.json()[0]["name"] == "Filtro Inicial"
    assert assignments_response.status_code == 200
    assert assignments_response.json()[0]["questionnaire_id"] == questionnaire["id"]
    assert templates_response.status_code == 200
    assert templates_response.json()[0]["name"] == "Entrevista UX"
    assert scorecards_response.status_code == 200
    assert scorecards_response.json()[0]["scorecard_template_id"] == template["id"]
