import boto3

def lambda_handler(event, context):
    textract = boto3.client('textract')

    # Lấy thông tin file từ sự kiện S3 trigger
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = event["Records"][0]["s3"]["object"]["key"]

    # Gọi Textract để phân tích tài liệu
    response = textract.analyze_document(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}},
        FeatureTypes=['FORMS']
    )

    print(response)

    # Lưu các BLOCK dạng key-value
    blocks = response['Blocks']
    key_map = {}
    value_map = {}
    block_map = {}

    for block in blocks:
        block_id = block['Id']
        block_map[block_id] = block
        if block['BlockType'] == 'KEY_VALUE_SET':
            if 'KEY' in block['EntityTypes']:
                key_map[block_id] = block
            else:
                value_map[block_id] = block

    # Tìm text từ block
    def get_text(result, block):
        text = ''
        if 'Relationships' in block:
            for rel in block['Relationships']:
                if rel['Type'] == 'CHILD':
                    for child_id in rel['Ids']:
                        word = block_map[child_id]
                        if word['BlockType'] == 'WORD':
                            text += word['Text'] + ' '
        return text.strip()

    # Ghép key-value
    extracted_data = {}

    for key_id, key_block in key_map.items():
        key_text = get_text(response, key_block)
        value_block = None

        if 'Relationships' in key_block:
            for rel in key_block['Relationships']:
                if rel['Type'] == 'VALUE':
                    for value_id in rel['Ids']:
                        value_block = value_map.get(value_id)
                        if value_block:
                            value_text = get_text(response, value_block)
                            extracted_data[key_text] = value_text


    print("DATA: ")
    print(extracted_data)
    # In ra kết quả
    print("Extracted Key-Value Pairs:")
    for k, v in extracted_data.items():
        print(f"{k}: {v}")

    return {
        "statusCode": 200,
        "body": f"Textract processed successfully. Extracted {len(extracted_data)} items."
    }
