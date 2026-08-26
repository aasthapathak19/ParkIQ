fetch('http://localhost:5000/health').then(r => r.json()).then(console.log).catch(console.error);
fetch('http://localhost:5000/ready').then(r => r.json()).then(console.log).catch(console.error);
