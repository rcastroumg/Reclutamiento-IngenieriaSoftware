from core.config import get_settings


def bootstrap_company(client, auth_headers):
    company = client.post(
        "/companies",
        json={"name": "Recruitment Solutions", "slug": "recruitment-solutions"},
        headers=auth_headers,
    ).json()
    return {**auth_headers, "X-Company-Id": str(company["id"])}


def build_application(client, auth_headers):
    scoped_headers = bootstrap_company(client, auth_headers)
    pipeline = client.post(
        "/pipelines",
        json={
            "name": "Pipeline Integraciones",
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
            "title": "DevOps Engineer",
            "description": "Gestionar despliegues e integraciones.",
            "location": "Remoto",
            "pipeline_id": pipeline["id"],
            "status": "open",
        },
        headers=scoped_headers,
    ).json()
    candidate = client.post(
        "/candidates",
        json={"full_name": "Carlos Ruiz", "email": "carlos@example.com"},
        headers=auth_headers,
    ).json()
    application = client.post(
        "/applications",
        json={"candidate_id": candidate["id"], "position_id": position["id"]},
        headers=scoped_headers,
    ).json()
    return scoped_headers, pipeline, application


def test_upload_and_download_application_document(client, auth_headers):
    scoped_headers, _, application = build_application(client, auth_headers)

    upload_response = client.post(
        f"/applications/{application['id']}/documents",
        headers=scoped_headers,
        files={"file": ("cv.txt", b"contenido del cv", "text/plain")},
    )

    assert upload_response.status_code == 201
    document = upload_response.json()
    assert document["original_filename"] == "cv.txt"

    list_response = client.get(f"/applications/{application['id']}/documents", headers=scoped_headers)

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    download_response = client.get(f"/documents/{document['id']}/download", headers=scoped_headers)

    assert download_response.status_code == 200
    assert download_response.content == b"contenido del cv"


def test_stage_move_creates_sent_notification_log(client, auth_headers):
    scoped_headers, pipeline, application = build_application(client, auth_headers)

    move_response = client.post(
        f"/applications/{application['id']}/move-stage",
        json={"stage_id": pipeline["stages"][1]["id"]},
        headers=scoped_headers,
    )

    assert move_response.status_code == 200

    notifications_response = client.get(
        f"/applications/{application['id']}/notifications",
        headers=scoped_headers,
    )

    assert notifications_response.status_code == 200
    assert len(notifications_response.json()) == 1
    assert notifications_response.json()[0]["status"] == "sent"


def test_stage_move_persists_even_when_notification_fails(client, auth_headers, monkeypatch):
    scoped_headers, pipeline, application = build_application(client, auth_headers)
    monkeypatch.setenv("MAIL_PROVIDER_MODE", "stub-fail")
    get_settings.cache_clear()

    move_response = client.post(
        f"/applications/{application['id']}/move-stage",
        json={"stage_id": pipeline["stages"][1]["id"]},
        headers=scoped_headers,
    )

    assert move_response.status_code == 200
    assert move_response.json()["current_stage_id"] == pipeline["stages"][1]["id"]

    notifications_response = client.get(
        f"/applications/{application['id']}/notifications",
        headers=scoped_headers,
    )

    assert notifications_response.status_code == 200
    assert notifications_response.json()[0]["status"] == "failed"
    assert notifications_response.json()[0]["error_message"] == "Stub mail provider failure"
