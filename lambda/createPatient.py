import json
import psycopg2
import os
import boto3

def handler(event, context):
    body = event.get('body', '{}')
    try:
        data = json.loads(body)
        print("Body: ")
        print(body)
        print("Data: ")
        print(data)


           // Lấy thông tin secret
            secret_name = os.environ['DB_SECRET']
            region_name = os.environ['AWS_REGION']
            session = boto3.session.Session()
            client = session.client(service_name='secretsmanager', region_name=region_name)
            secret = json.loads(client.get_secret_value(SecretId=secret_name)['SecretString'])

            conn = psycopg2.connect(
                host=os.environ['DB_HOST'],
                dbname='hospital',
                user=secret['username'],
                password=secret['password']
            )

            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO patients (patient_id, full_name, date_of_birth, email, phone_number, allergies)
                    VALUES (%(patient_id)s, %(full_name)s, %(date_of_birth)s, %(email)s, %(phone_number)s, %(allergies)s)
                """, {
                    **body,
                    "allergies": body.get("allergies", [])
                })
                conn.commit()

            return {
                "statusCode": 201,
                "body": json.dumps({"message": "Patient created"})
            }
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
