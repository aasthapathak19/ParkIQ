fetch("http://localhost:5000/api/v1/health")
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data)))
    .catch(e => console.error(e.message));
