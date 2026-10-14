# `/limesurvey` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/limesurvey/{surveyid}/surveylanguages` | [getSurveyLanguages](#getsurveylanguages) |
| `PATCH` | `/limesurvey/{surveyid}/surveyowner` | [updateSurveyOwner](#updatesurveyowner) |
| `GET` | `/limesurvey/isAdmin` | [getLimesurveyAdmin](#getlimesurveyadmin) |
| `GET` | `/limesurvey/surveys` | [getUserSurveyList](#getusersurveylist) |

## getSurveyLanguages

`GET /limesurvey/{surveyid}/surveylanguages`

**get the survey languages for a Limesurvey survey**

getSurveyLanguages

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/limesurvey/{surveyid}/surveylanguages" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `surveyid` | integer | yes | The survey ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Survey Languages List | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## updateSurveyOwner

`PATCH /limesurvey/{surveyid}/surveyowner`

**update the survey owner for a Limesurvey activity**

updateSurveyOwner

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/limesurvey/{surveyid}/surveyowner" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `surveyid` | integer | yes | The survey ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Survey Updated | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getLimesurveyAdmin

`GET /limesurvey/isAdmin`

**gets user is admin of Limesurvey**

gets user is admin of Limesurvey

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/limesurvey/isAdmin" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | gets user is admin of Limesurvey | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getUserSurveyList

`GET /limesurvey/surveys`

**get user survey list for a Limesurvey activity**

getUserSurveyList

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/limesurvey/surveys" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Survey List | array<object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---
