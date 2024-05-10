const SQLite3 = require("sqlite3");

module.exports = app => {
    
    const db = new SQLite3.Database('imob.db', SQLite3.OPEN_READWRITE, function(erro){
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

        // Verificar se o ID de cliente fornecido existe na tabela de clientes
        db.get("SELECT id_cliente FROM cliente WHERE id_cliente = ?", [reg.cliente_id_cliente], function(err, row) {
            if (err || !row)
                return res.status(400).send("ID de cliente inválido");

            // Inserir o comentário apenas se o ID de cliente existir
            db.run("INSERT INTO comentario (descricao, cliente_id_cliente) VALUES (?, ?)",
                [reg.descricao, reg.cliente_id_cliente],
                function(erro) {
                    if (erro)
                        return res.status(500).send("Erro ao inserir comentário: " + erro.message);
                    else
                        return res.status(201).send("Comentário inserido com sucesso!");
                });
        });
    });

    // Atualizar um comentário
    app.put('/comentario/:id', function(req, res){
        let reg = req.body;

        // Verificar se o ID de comentário fornecido existe na tabela de comentários
        db.get("SELECT id_comentario FROM comentario WHERE id_comentario = ?", [req.params.id], function(err, row) {
            if (err || !row)
                return res.status(400).send("ID de comentário inválido");

            // Atualizar apenas a descrição do comentário se o ID de comentário existir
            db.run("UPDATE comentario SET descricao = ? WHERE id_comentario = ?",
                [reg.descricao, req.params.id],
                function (erro)
                {
                    if (erro)
                        return res.status(500).send("Erro ao atualizar comentário: " + erro.message);
                    else
                        return res.status(200).send("Comentário atualizado com sucesso!");
                });
        });
    });

    // Deletar um comentário
    app.delete('/comentario/:id', function(req, res){
        let deleta = 'DELETE FROM comentario WHERE id_comentario = ?';

        // Verificar se o ID de comentário fornecido existe na tabela de comentários
        db.get("SELECT id_comentario FROM comentario WHERE id_comentario = ?", [req.params.id], function(err, row) {
            if (err || !row)
                return res.status(400).send("ID de comentário inválido");

            // Excluir o comentário apenas se o ID de comentário existir
            db.run(deleta, [req.params.id], function (erro) {
                if (erro)
                    return res.status(500).send("Erro ao deletar comentário: " + erro.message);
                else
                    return res.status(200).send("Comentário deletado com sucesso!");
            });
        });
    });
};
