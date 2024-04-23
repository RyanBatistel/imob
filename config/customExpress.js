//Criando acesso a biblioteca express
const express = require ('express'); 

//Criando acesso para usar o Consign
const consign = require ('consign');

//Criando objeto que acessa recursos da express
module.exports = () => {
    
    const app = express(); 
    app.use(express.json());

    consign()
        .include('controller')
        .into(app);

        return app;

};