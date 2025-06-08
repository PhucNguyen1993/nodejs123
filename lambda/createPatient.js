exports.handler = async (event) => {
  const data = JSON.parse(event.body || '{}');

  if (!data.full_name || !data.date_of_birth || !data.phone_number) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing fields" })
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({ message: "Patient created", patient: data })
  };
};
