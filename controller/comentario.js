const SQLite3 = require("sqlite3");

module.exports = app => {
    
    const db = new SQLite3.Database('imob', SQLite3.OPEN_READWRITE, function(erro){
        if(erro)
            return console.log("Houve erro de conexão: " + erro.message)
    });

    // Selecionar todos os comentários
    app.get('/comentario', (req, res) => {
        db.all("SELECT * FROM comentario", [], function(erro, linhas){
            if(erro)
                return res.status(500).send("Ocorreu um erro na consulta: " + erro.message);
            else    
                return res.status(200).json(linhas);
        });
    });

    // Inserir um novo comentário
    app.post('/comentario', function(req, res) {
        let reg = req.body;

        db.run("INSERT INTO comentario (descricao, cliente_id_cliente) VALUES (?, ?)",
            [reg.descricao, reg.cliente_id_cliente],
            function(erro) {
                if (erro)
                    return res.status(500).send("Erro ao inserir comentário: " + erro.message);
                else
                    return res.status(201).send("Comentário inserido com sucesso!");
            });
    });

    // Atualizar um comentário
    app.put('/comentario/:id', function(req, res){
        let reg = req.body;

        db.run("UPDATE comentario SET descricao = ?, cliente_id_cliente = ? WHERE id_comentario = ?",
            [reg.descricao, reg.cliente_id_cliente, req.params.id],
            function (erro)
            {
                if (erro)
                    return res.status(500).send("Erro ao atualizar comentário: " + erro.message);
                else
                    return res.status(200).send("Comentário atualizado com sucesso!");
            });
    });

    // Deletar um comentário
    app.delete('/comentario/:id', function(req, res){
        let deleta = 'DELETE FROM comentario WHERE id_comentario = ?';

        db.run(deleta, 
            [req.params.id], 
            function (erro)
            {
                if (erro)
                    return res.status(500).send("Erro ao deletar comentário: " + erro.message);
                else
                    return res.status(200).send("Comentário deletado com sucesso!");
            });
    });
};
