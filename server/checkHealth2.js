fetch('http://127.0.0.1:5000/health').then(r => r.json()).then(console.log).catch(console.error);
fetch('http://[::1]:5000/health').then(r => r.json()).then(console.log).catch(console.error);
