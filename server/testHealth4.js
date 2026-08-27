const endpoints = [
  "http://localhost:5000/health",
  "http://localhost:5000/live",
  "http://localhost:5000/ready"
];

Promise.all(endpoints.map(ep => 
  fetch(ep)
    .then(r => r.json())
    .then(data => console.log(`[${ep}]`, JSON.stringify(data)))
    .catch(e => console.error(`[${ep}] Error:`, e.message))
));
