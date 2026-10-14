# Tag simlets and sessions

Tags are permission scoped labels. You only see tags on studies you can see, which makes them
usable for shared workspaces without leaking the existence of other people's studies.

## Create a tag

```bash
curl -s -X POST "$SIMVA_URL/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tag_name": "cognitive-load", "tag_color": "#FF5733"}' | jq
```

```json
{ "tag_id": 12, "tag_name": "cognitive-load", "tag_color": "#FF5733" }
```

`tag_name` and `tag_color` are both required.

## Rename or recolour

```bash
curl -s -X PATCH "$SIMVA_URL/tags/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tag_name": "cognitive-load-2026", "tag_color": "#2E86AB"}' | jq
```

## Attach to a session

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/tags/12" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -s -X DELETE "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/tags/12" \
  -H "Authorization: Bearer $TOKEN"
```

## See what you may use

```bash
curl -s "$SIMVA_URL/tags" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/simlets/tags" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/tags" -H "Authorization: Bearer $TOKEN" | jq
```

The first list is "every tag available to me"; the second is "tags in use across simlets";
the third is "tags on this simlet".

## Filter by tag

```bash
curl -s "$SIMVA_URL/simlets?tag=12" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions?tag=12" -H "Authorization: Bearer $TOKEN" | jq
```

Filtering happens in SQL, inside the views, with your user id passed in as a parameter. That
is why the filter is permission aware rather than filtered afterwards in JavaScript.

## Gotchas

- **Visibility is enforced in SQL, not in JavaScript.** A bug in the tag view shows users tags
  they should not see; there is no second check downstream.
- **Tags belong to the person who created them** in the sense that only tags visible to you
  can be attached to your sessions.
- **`DELETE /tags/{tagid}` removes the tag everywhere**, including from sessions you cannot
  see. Check first.