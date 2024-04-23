const customExpress = require('./config/customExpress.js');

const app = customExpress();

//Gerando o primiero comando do servidor, gerando listen ouvindo a porta 3000
app.listen(3000, () => console.log('Servidor 3000')); 

app.get('/', (req, res) => res.send('Rota principal'));







