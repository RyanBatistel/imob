import sqlite3 from "sqllite3";

const SQLite3 = sqlite3.verbose();

function execucaoSql(comando, parametros, metodo = "all"){
    return new Promise(function(resolve, reject ){
        db[metodo](comando, parametros, function(erro, result){
            if(erro)
                reject(erro)
            else
                resolve(result);
        })
    })
}

const db = new SQLite3.Database('imob.db', SQLite3.open_readwrite, function(erro){
    if(erro)
        return console.log("Houve erro de conexao: " + erro.message);
});
    export {db, execucaoSql};
