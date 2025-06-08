import json

def handler(event, context):
    body = event.get('body', '{}')
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid JSON"})
        }

    if not data.get("full_name") or not data.get("date_of_birth") or not data.get("phone_number"):
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Missing fields"})
        }

    return {
        "statusCode": 201,
        "body": json.dumps({"message": "Patient created", "patient": data})
    }
