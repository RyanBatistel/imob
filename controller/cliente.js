const SQLite3 = require("sqlite3");

module.exports = app => {
    
    const db = new SQLite3.Database('imob', SQLite3.OPEN_READWRITE, function(erro){
        if(erro)
            return console.log("Houve erro de conexão: " + erro.message)
    });

    // Selecionar todos os clientes
    app.get('/cliente', (req, res) => {
        db.all("SELECT * FROM cliente", [], function(erro, linhas){
            if(erro)
                return res.status(500).send("Ocorreu um erro na consulta: " + erro.message);
            else    
                return res.status(200).json(linhas);
        });
    });

    // Inserir um novo cliente com login
    app.post('/cliente', (req, res) => {
        let reg = req.body; //.cliente;
        //let login = req.body.login;

        console.log(reg);
        // Insere o login na tabela 'login'
        db.run("INSERT INTO login (email, senha, perfil) VALUES (?, ?, ?)",
            [reg.email, reg.senha, reg.perfil],
            function(erro) {
                if (erro)
                    return res.status(500).send("Erro ao inserir login: " + erro.message);
                
                // Insere o cliente com o ID do login inserido
                inserirCliente(reg, this.lastID, res);
            });
    });

    // Função para inserir o cliente com o ID do login
    function inserirCliente(reg, loginId, res) {
        db.run("INSERT INTO cliente (nome, telefone, dt_nascimento, genero, login_id_login) VALUES (?, ?, ?, ?, ?)",
            [reg.nome, reg.telefone, reg.dt_nascimento, reg.genero, loginId],
            function (erro)
            {
                if (erro)
                    return res.status(500).send("Erro ao inserir cliente: " + erro.message);
                else
                    return res.status(201).send("Cliente inserido com sucesso!");
            });
    }

    // Deletar um cliente e seu login associado
    app.delete('/cliente/:id', function(req, res){
        let clienteId = req.params.id;

        // Busca o ID do login associado ao cliente
        db.get("SELECT login_id_login FROM cliente WHERE id_cliente = ?", [clienteId], function(err, row) {
            if (err)
                return res.status(500).send("Erro ao buscar ID do login: " + err.message);

            let loginId = row.login_id_login;

            // Deleta o cliente
            db.run("DELETE FROM cliente WHERE id_cliente = ?", [clienteId], function (err) {
                if (err)
                    return res.status(500).send("Erro ao deletar cliente: " + err.message);

                // Deleta o login associado ao cliente
                db.run("DELETE FROM login WHERE id_login = ?", [loginId], function (err) {
                    if (err)
                        return res.status(500).send("Erro ao deletar login: " + err.message);

                    return res.status(200).send("Cliente e login deletados com sucesso!");
                });
            });
        });
    });

    // Atualizar um cliente e seu login associado
    app.put('/cliente/:id', function(req, res){
        let clienteId = req.params.id;
        let cliente = req.body.cliente; 
        let login = req.body.login;
        let mensagem = '';

        console.log("Dados do cliente");
        console.log(clienteId);
        console.log(cliente.nome);
        console.log("Dados do login:", login);

        // Atualiza o cliente
        db.run(`UPDATE cliente 
                   SET nome = ?, 
                       telefone = ?, 
                       dt_nascimento = ?,
                       genero = ?
                 WHERE id_cliente = ?`,
            [cliente.nome, 
             cliente.telefone,
             cliente.dt_nascimento, 
             cliente.genero, 
             clienteId],
            function (err) {
                if (err)
                    mensagem = "Erro ao atualizar cliente: " + err.message;
            }
        );

        // Atualiza o login associado ao cliente
        db.run(`UPDATE login 
                   SET email = ?, 
                       senha = ?, 
                       perfil = ?
                 WHERE id_login = ?`,
                    [login.email, 
                     login.senha, 
                     login.perfil, 
                     clienteId],
                    function (err) {
                        if (err)
                            mensagem = "Erro ao atualizar login: " + err.message;
                    });

        if (mensagem == '')
            return res.status(200).send("Cliente e login atualizados com sucesso!")
        else
            return res.status(500).send(mensagem);
    });
};
